import { BadGatewayException, BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { getPaymentProvider, type InitChargeInput } from "@physio/payments";
import { type SessionUser, PLATFORM_FEE_BPS, RELEASE_DELAY_HOURS } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";

@Injectable()
export class PaymentsService {
    private readonly provider = getPaymentProvider();
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
        private readonly events: EventEmitter2,
    ) { }

    async initializeCharge(input: InitChargeInput) {
        try {
            return await this.provider.initializeCharge(input);
        } catch (err) {
            this.logger.error("initializeCharge failed", err);
            throw new BadGatewayException({ code: "PAYMENT_UNAVAILABLE", message: "Payment service is unavailable" });
        }
    }

    async verifyRaw(reference: string): Promise<"success" | "pending"> {
        try {
            const result = await this.provider.verifyCharge(reference);
            return result.status === "success" ? "success" : "pending";
        } catch {
            throw new BadGatewayException({ code: "PAYMENT_UNAVAILABLE", message: "Could not verify payment" });
        }
    }

    async verifyCharge(user: SessionUser, reference: string) {
        const payment = await this.prisma.client.payment.findFirst({
            where: { providerRef: reference },
            include: { appointment: { select: { patientId: true, physioId: true } } },
        });
        if (!payment) throw new NotFoundException({ code: "NOT_FOUND", message: "Payment not found" });
        const appt = payment.appointment;
        const isOwner = appt.patientId === user.id || appt.physioId === user.id;
        if (!isOwner && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your payment" });
        }
        try {
            return await this.provider.verifyCharge(reference);
        } catch (err) {
            this.logger.error(`verifyCharge failed for reference ${reference}`, err);
            throw new BadGatewayException({ code: "PAYMENT_UNAVAILABLE", message: "Payment service is unavailable" });
        }
    }

    /**
     * Append an immutable ledger entry and compute running balance.
     * Never delete; never mutate. Corrections are new entries.
     */
    async recordLedger(input: {
        appointmentId: string;
        type: "CHARGE" | "HOLD" | "RELEASE" | "PLATFORM_FEE" | "PHYSIO_PAYOUT" | "REFUND";
        amountKobo: number;
        note?: string;
    }) {
        const payment = await this.prisma.client.payment.findUnique({
            where: { appointmentId: input.appointmentId },
            include: { entries: { orderBy: { createdAt: "desc" }, take: 1 } },
        });
        if (!payment) throw new Error(`No payment for appointment ${input.appointmentId}`);

        const lastBalance = payment.entries[0]?.balanceAfterKobo ?? 0;
        const balanceAfter = lastBalance + input.amountKobo;

        return this.prisma.client.ledgerEntry.create({
            data: {
                paymentId: payment.id,
                appointmentId: input.appointmentId,
                type: input.type,
                amountKobo: input.amountKobo,
                balanceAfterKobo: balanceAfter,
                note: input.note ?? null,
            },
        });
    }

    async releaseToPhysio(appointmentId: string) {
        const payment = await this.prisma.client.payment.findUnique({
            where: { appointmentId },
        });
        if (!payment || payment.status !== "HELD") return;

        const platformFee = Math.round((payment.amountKobo * PLATFORM_FEE_BPS) / 10_000);
        const physioPayout = payment.amountKobo - platformFee;

        await this.prisma.client.$transaction(async (tx) => {
            await tx.payment.update({
                where: { appointmentId },
                data: { status: "RELEASED" },
            });
        });

        await this.recordLedger({
            appointmentId,
            type: "RELEASE",
            amountKobo: -payment.amountKobo,
            note: "Session completed — releasing held funds",
        });
        await this.recordLedger({
            appointmentId,
            type: "PLATFORM_FEE",
            amountKobo: platformFee,
            note: `${PLATFORM_FEE_BPS / 100}% platform fee`,
        });
        await this.recordLedger({
            appointmentId,
            type: "PHYSIO_PAYOUT",
            amountKobo: physioPayout,
            note: "Physio earnings recorded",
        });

        await this.audit.record({
            actorId: null,
            action: "payment.release",
            entity: "Payment",
            entityId: payment.id,
        });
    }

    async refund(appointmentId: string, reason: string, adminId: string) {
        const payment = await this.prisma.client.payment.findUnique({
            where: { appointmentId },
            include: { appointment: { select: { patientId: true } } },
        });
        if (!payment) return;
        if (payment.status === "REFUNDED") return;

        // Write status updates and wallet credit atomically.
        // This prevents the appointment showing REFUNDED without a matching wallet entry.
        await this.prisma.client.$transaction(async (tx) => {
            await tx.payment.update({
                where: { appointmentId },
                data: { status: "REFUNDED" },
            });
            await tx.appointment.update({
                where: { id: appointmentId },
                data: { status: "REFUNDED" },
            });

            // Idempotent: skip if a credit for this appointment already exists.
            const existingCredit = await tx.walletEntry.findFirst({
                where: { patientId: payment.appointment.patientId, ref: appointmentId, type: "REFUND_CREDIT" },
            });
            if (!existingCredit) {
                await tx.walletEntry.create({
                    data: {
                        patientId: payment.appointment.patientId,
                        amountKobo: payment.amountKobo,
                        type: "REFUND_CREDIT",
                        ref: appointmentId,
                        note: "Refund credited to wallet",
                    },
                });
            }
        });

        await this.recordLedger({
            appointmentId,
            type: "REFUND",
            amountKobo: -payment.amountKobo,
            note: `Refund: ${reason}`,
        });

        await this.audit.record({
            actorId: adminId,
            action: "payment.refund",
            entity: "Payment",
            entityId: payment.id,
        });
    }

    async ledgerForAppointment(appointmentId: string) {
        return this.prisma.client.ledgerEntry.findMany({
            where: { appointmentId },
            orderBy: { createdAt: "asc" },
        });
    }

    async ledgerAll(limit = 100) {
        return this.prisma.client.ledgerEntry.findMany({
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                appointment: {
                    include: { patient: { include: { user: true } }, physio: { include: { user: true } } },
                },
            },
        });
    }

    /**
     * Called from the payment callback page. Verifies with Paystack and,
     * if successful, fires payment.succeeded so the appointment is confirmed.
     * Safe to call multiple times — confirmAfterPayment() is idempotent.
     */
    async confirmFromCallback(reference: string) {
        const payment = await this.prisma.client.payment.findFirst({
            where: { providerRef: reference },
            select: { id: true, status: true, appointmentId: true },
        });
        if (!payment) throw new NotFoundException({ code: "NOT_FOUND", message: "Payment not found" });

        // Already processed — just return current appointment status.
        if (payment.status !== "PENDING") {
            const appt = await this.prisma.client.appointment.findUnique({
                where: { id: payment.appointmentId },
                select: { id: true, status: true },
            });
            return { status: appt?.status ?? "UNKNOWN" };
        }

        let result;
        try {
            result = await this.provider.verifyCharge(reference);
        } catch {
            throw new BadGatewayException({ code: "PAYMENT_UNAVAILABLE", message: "Could not verify payment" });
        }

        if (result.status !== "success") {
            return { status: "PENDING_PAYMENT" };
        }

        this.events.emit("payment.succeeded", { appointmentId: payment.appointmentId, reference });
        return { status: "CONFIRMED" };
    }

    async confirmByAppointmentId(appointmentId: string) {
        const payment = await this.prisma.client.payment.findUnique({
            where: { appointmentId },
            select: { id: true, status: true, providerRef: true },
        });
        if (!payment) throw new NotFoundException({ code: "NOT_FOUND", message: "Payment not found" });

        if (payment.status !== "PENDING") {
            const appt = await this.prisma.client.appointment.findUnique({
                where: { id: appointmentId },
                select: { status: true },
            });
            return { status: appt?.status ?? "UNKNOWN" };
        }

        if (!payment.providerRef) {
            throw new NotFoundException({ code: "NO_REFERENCE", message: "No payment reference on record" });
        }

        let result;
        try {
            result = await this.provider.verifyCharge(payment.providerRef);
        } catch {
            throw new BadGatewayException({ code: "PAYMENT_UNAVAILABLE", message: "Could not verify payment" });
        }

        if (result.status !== "success") {
            return { status: "PENDING_PAYMENT" };
        }

        this.events.emit("payment.succeeded", { appointmentId, reference: payment.providerRef });
        return { status: "CONFIRMED" };
    }

    async getWallet(physioId: string) {
        const [payouts, withdrawals, pendingAppts] = await Promise.all([
            this.prisma.client.ledgerEntry.findMany({
                where: { type: "PHYSIO_PAYOUT", appointment: { physioId } },
                include: {
                    appointment: {
                        select: {
                            id: true,
                            startsAt: true,
                            patient: { select: { user: { select: { name: true } } } },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.client.withdrawal.findMany({
                where: { physioId },
                orderBy: { createdAt: "desc" },
            }),
            // Appointments with signed notes whose payout hasn't been released yet.
            this.prisma.client.appointment.findMany({
                where: {
                    physioId,
                    status: "COMPLETED",
                    notes: { signedAt: { not: null } },
                    ledger: { none: { type: "PHYSIO_PAYOUT" } },
                    payment: { status: "HELD" },
                },
                select: {
                    id: true,
                    startsAt: true,
                    payment: { select: { amountKobo: true } },
                    patient: { select: { user: { select: { name: true } } } },
                    notes: { select: { signedAt: true } },
                },
                orderBy: { updatedAt: "desc" },
                take: 20,
            }),
        ]);

        const totalEarnedKobo = payouts.reduce((s, e) => s + e.amountKobo, 0);
        const withdrawnKobo = withdrawals
            .filter((w) => w.status !== "REJECTED")
            .reduce((s, w) => s + w.amountKobo, 0);
        const availableKobo = Math.max(0, totalEarnedKobo - withdrawnKobo);

        const pendingPayouts = pendingAppts.map((a) => {
            const signedAt = a.notes!.signedAt!;
            const releaseAt = new Date(signedAt.getTime() + RELEASE_DELAY_HOURS * 3_600_000);
            const estimatedKobo = a.payment
                ? Math.round(a.payment.amountKobo * (1 - PLATFORM_FEE_BPS / 10_000))
                : 0;
            return {
                appointmentId: a.id,
                startsAt: a.startsAt.toISOString(),
                signedAt: signedAt.toISOString(),
                releaseAt: releaseAt.toISOString(),
                patientName: a.patient?.user.name ?? "Patient",
                estimatedKobo,
            };
        });

        return { availableKobo, totalEarnedKobo, payouts, withdrawals, pendingPayouts };
    }

    async requestWithdrawal(
        physioId: string,
        input: { amountKobo: number; bankName: string; accountNumber: string; accountName: string },
    ) {
        const { availableKobo } = await this.getWallet(physioId);
        if (input.amountKobo > availableKobo) {
            throw new BadRequestException({ code: "INSUFFICIENT_BALANCE", message: "Amount exceeds available balance" });
        }
        if (input.amountKobo <= 0) {
            throw new BadRequestException({ code: "INVALID_AMOUNT", message: "Withdrawal amount must be positive" });
        }
        return this.prisma.client.withdrawal.create({
            data: { physioId, ...input },
        });
    }
}