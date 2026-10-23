import crypto from "node:crypto";
import { Test } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { PaystackWebhookController } from "./paystack-webhook.controller.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { EventEmitter2 } from "@nestjs/event-emitter";

const SECRET = "test-webhook-secret";
const APPT_ID = "appt-wh-test";
const REF = "ref-test-001";

function makeSignedRequest(body: object, secret = SECRET) {
    const raw = Buffer.from(JSON.stringify(body));
    const sig = crypto.createHmac("sha512", secret).update(raw).digest("hex");
    return {
        rawBody: raw,
        body,
        headers: { "x-paystack-signature": sig },
    };
}

describe("PaystackWebhookController", () => {
    let ctrl: PaystackWebhookController;
    let prisma: { client: { payment: { findUnique: jest.Mock } } };
    let emitter: { emit: jest.Mock };

    const PAYLOAD = {
        event: "charge.success",
        data: { reference: REF, status: "success", metadata: { appointmentId: APPT_ID } },
    };

    beforeEach(async () => {
        process.env.PAYSTACK_SECRET_KEY = SECRET;

        prisma = {
            client: { payment: { findUnique: jest.fn().mockResolvedValue({ status: "PENDING" }) } },
        };
        emitter = { emit: jest.fn() };

        const mod = await Test.createTestingModule({
            controllers: [PaystackWebhookController],
            providers: [
                { provide: PrismaService, useValue: prisma },
                { provide: EventEmitter2, useValue: emitter },
            ],
        }).compile();

        ctrl = mod.get(PaystackWebhookController);
    });

    afterEach(() => { delete process.env.PAYSTACK_SECRET_KEY; });

    it("accepts webhook with valid HMAC-SHA512 signature", async () => {
        const req = makeSignedRequest(PAYLOAD);
        const result = await ctrl.handle(req as any, req.headers["x-paystack-signature"]);
        expect(result).toMatchObject({ ok: true });
        expect(emitter.emit).toHaveBeenCalledWith("payment.succeeded", {
            appointmentId: APPT_ID,
            reference: REF,
        });
    });

    it("rejects webhook with bad signature", async () => {
        const req = makeSignedRequest(PAYLOAD);
        await expect(
            ctrl.handle(req as any, "0000000000000000000000000000000000000000")
        ).rejects.toThrow(BadRequestException);
        expect(emitter.emit).not.toHaveBeenCalled();
    });

    it("rejects webhook signed with wrong secret", async () => {
        const req = makeSignedRequest(PAYLOAD, "wrong-secret");
        await expect(
            ctrl.handle(req as any, req.headers["x-paystack-signature"])
        ).rejects.toThrow(BadRequestException);
    });

    it("is idempotent: already-processed payment returns ignored", async () => {
        prisma.client.payment.findUnique.mockResolvedValue({ status: "HELD" });
        const req = makeSignedRequest(PAYLOAD);
        const result = await ctrl.handle(req as any, req.headers["x-paystack-signature"]);
        expect(result).toMatchObject({ ok: true, ignored: "already_processed" });
        expect(emitter.emit).not.toHaveBeenCalled();
    });

    it("ignores non-charge-success events", async () => {
        const otherPayload = { ...PAYLOAD, event: "transfer.success" };
        const req = makeSignedRequest(otherPayload);
        const result = await ctrl.handle(req as any, req.headers["x-paystack-signature"]);
        expect(result).toMatchObject({ ok: true, ignored: "transfer.success" });
        expect(emitter.emit).not.toHaveBeenCalled();
    });
});
