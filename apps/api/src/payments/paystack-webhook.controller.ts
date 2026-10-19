import { Controller, Headers, Post, Req, BadRequestException, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import crypto from "node:crypto";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service.js";

@Controller("payments")
export class PaystackWebhookController {
    private readonly logger = new Logger(PaystackWebhookController.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly events: EventEmitter2,
    ) { }

    @Post("paystack/webhook")
    async handle(@Req() req: Request, @Headers("x-paystack-signature") signature: string) {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) throw new BadRequestException({ code: "NO_SECRET", message: "Not configured" });

        const raw = (req as any).rawBody as Buffer | undefined;
        if (!raw) throw new BadRequestException({ code: "NO_RAW_BODY", message: "Raw body missing" });
        const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex"); fcpm
        if (expected !== signature) {
            this.logger.warn("Paystack webhook signature mismatch");
            throw new BadRequestException({ code: "BAD_SIGNATURE", message: "Invalid signature" });
        }

        const { event, data } = req.body as { event: string; data: { reference: string; status: string; metadata?: { appointmentId?: string } } };

        if (event !== "charge.success" || data.status !== "success") {
            return { ok: true, ignored: event };
        }

        const appointmentId = data.metadata?.appointmentId;
        if (!appointmentId) {
            this.logger.warn(`Webhook missing appointmentId in metadata: ${data.reference}`);
            return { ok: true, ignored: "no_metadata" };
        }

        // Idempotency: if payment already HELD/RELEASED, skip.
        const payment = await this.prisma.client.payment.findUnique({ where: { appointmentId } });
        if (payment && payment.status !== "PENDING") {
            return { ok: true, ignored: "already_processed" };
        }

        this.events.emit("payment.succeeded", { appointmentId, reference: data.reference });
        return { ok: true };
    }
}