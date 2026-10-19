import { Injectable } from "@nestjs/common";
import { getPaymentProvider, type InitChargeInput } from "@physio/payments";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import { OnEvent } from "@nestjs/event-emitter";

const PLATFORM_FEE_BPS = 1500; // 15%

@Injectable()
export class PaymentsService {
    private readonly provider = getPaymentProvider();

    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
    ) { }

    async initializeCharge(input: InitChargeInput) {
        return this.provider.initializeCharge(input);
    }

    async verifyCharge(reference: string) {
        return this.provider.verifyCharge(reference);
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
            amountKobo: -physioPayout,
            note: "Physio earnings recorded",
        });

        await this.audit.record({
            actorId: null,
            action: "payment.release",
            entity: "Payment",
            entityId: payment.id,
        });
    }

    @OnEvent("session.completed")
    async onSessionCompleted(payload: { appointmentId: string }) {
        await this.releaseToPhysio(payload.appointmentId);
    }

    async refund(appointmentId: string, reason: string, adminId: string) {
        const payment = await this.prisma.client.payment.findUnique({
            where: { appointmentId },
        });
        if (!payment || !payment.providerRef) return;
        if (payment.status === "REFUNDED") return;

        const result = await this.provider.refund({ reference: payment.providerRef });
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
}