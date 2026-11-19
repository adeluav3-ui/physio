import { BadGatewayException, BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { getPaymentProvider, type InitChargeInput } from "@physio/payments";
import { type SessionUser, PLATFORM_FEE_BPS } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";

@Injectable()
export class PaymentsService {
    private readonly provider = getPaymentProvider();
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
    ) { }

    async initializeCharge(input: InitChargeInput) {
        try {
            return await this.provider.initializeCharge(input);
        } catch (err) {
            this.logger.error("initializeCharge failed", err);
            throw new BadGatewayException({ code: "PAYMENT_UNAVAILABLE", message: "Payment service is unavailable" });
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
        });
        if (!payment || !payment.providerRef) return;
        if (payment.status === "REFUNDED") return;

        let result;
        try {
            result = await this.provider.refund({ reference: payment.providerRef });
        } catch (err) {
            this.logger.error(`refund failed for appointment ${appointmentId}`, err);
            throw new BadGatewayException({ code: "PAYMENT_UNAVAILABLE", message: "Payment service is unavailable" });
        }
        if (result.status !== "success") {
            throw new Error(`Refund failed: ${JSON.stringify(result.raw)}`);
        }

        await this.prisma.client.$transaction(async (tx) => {
            await tx.payment.update({
                where: { appointmentId },
                data: { status: "REFUNDED" },
            });
            await tx.appointment.update({
                where: { id: appointmentId },
                data: { status: "REFUNDED" },
            });
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

    async getWallet(physioId: string) {
        const [payouts, withdrawals] = await Promise.all([
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
        ]);

        const totalEarnedKobo = payouts.reduce((s, e) => s + e.amountKobo, 0);
        const withdrawnKobo = withdrawals
            .filter((w) => w.status !== "REJECTED")
            .reduce((s, w) => s + w.amountKobo, 0);
        const availableKobo = Math.max(0, totalEarnedKobo - withdrawnKobo);

        return { availableKobo, totalEarnedKobo, payouts, withdrawals };
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