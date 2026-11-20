import {
    BadGatewayException,
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { SessionUser } from "@physio/shared";
import { getPaymentProvider } from "@physio/payments";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";

const MIN_DEPOSIT_KOBO = 10_000;   // ₦100 minimum
const MAX_DEPOSIT_KOBO = 50_000_000; // ₦500,000 maximum

@Injectable()
export class WalletService {
    private readonly provider = getPaymentProvider();

    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
    ) {}

    private assertPatient(user: SessionUser) {
        if (user.role !== "PATIENT") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Patient only" });
        }
    }

    async getBalance(user: SessionUser) {
        this.assertPatient(user);

        const entries = await this.prisma.client.walletEntry.findMany({
            where: { patientId: user.id },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        const balanceKobo = entries.reduce((sum, e) => sum + e.amountKobo, 0);

        return { balanceKobo, entries };
    }

    async initiateDeposit(user: SessionUser, amountKobo: number) {
        this.assertPatient(user);

        if (amountKobo < MIN_DEPOSIT_KOBO) {
            throw new BadRequestException({
                code: "AMOUNT_TOO_SMALL",
                message: `Minimum deposit is ₦${MIN_DEPOSIT_KOBO / 100}`,
            });
        }
        if (amountKobo > MAX_DEPOSIT_KOBO) {
            throw new BadRequestException({
                code: "AMOUNT_TOO_LARGE",
                message: `Maximum deposit is ₦${MAX_DEPOSIT_KOBO / 100}`,
            });
        }

        const reference = `wallet-${randomUUID()}`;
        const appUrl = process.env.APP_URL ?? "http://localhost:3000";

        let result;
        try {
            result = await this.provider.initializeCharge({
                email: user.email,
                amountKobo,
                currency: "NGN",
                reference,
                callbackUrl: `${appUrl}/app/wallet/callback?ref=${reference}`,
                metadata: { patientId: user.id, type: "WALLET_DEPOSIT" },
            });
        } catch {
            throw new BadGatewayException({
                code: "PAYMENT_UNAVAILABLE",
                message: "Payment service is unavailable",
            });
        }

        return { authorizationUrl: result.authorizationUrl, reference };
    }

    async confirmDeposit(user: SessionUser, reference: string) {
        this.assertPatient(user);

        // Idempotent — if already credited, return current balance
        const existing = await this.prisma.client.walletEntry.findFirst({
            where: { patientId: user.id, ref: reference, type: "DEPOSIT" },
        });
        if (existing) {
            const { balanceKobo } = await this.getBalance(user);
            return { status: "CREDITED", balanceKobo };
        }

        let result;
        try {
            result = await this.provider.verifyCharge(reference);
        } catch {
            throw new BadGatewayException({
                code: "PAYMENT_UNAVAILABLE",
                message: "Could not verify payment",
            });
        }

        if (result.status !== "success") {
            return { status: "PENDING" };
        }

        const amountKobo = result.amountKobo;
        if (!amountKobo || amountKobo <= 0) {
            throw new NotFoundException({ code: "INVALID_AMOUNT", message: "Invalid payment amount" });
        }

        await this.prisma.client.walletEntry.create({
            data: {
                patientId: user.id,
                amountKobo,
                type: "DEPOSIT",
                ref: reference,
                note: "Wallet top-up via Paystack",
            },
        });

        await this.audit.record({
            actorId: user.id,
            action: "wallet.deposit",
            entity: "WalletEntry",
            entityId: user.id,
        });

        const { balanceKobo } = await this.getBalance(user);
        return { status: "CREDITED", balanceKobo };
    }

    /** Called by payments service when an appointment is refunded. */
    async creditRefund(patientId: string, amountKobo: number, appointmentId: string) {
        await this.prisma.client.walletEntry.create({
            data: {
                patientId,
                amountKobo,
                type: "REFUND_CREDIT",
                ref: appointmentId,
                note: "Refund credited to wallet",
            },
        });
    }
}
