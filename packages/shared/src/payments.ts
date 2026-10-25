import { z } from "zod";
import { idSchema } from "./common.js";
import { LedgerEntryType, PaymentStatus } from "./enums.js";

export const paymentSchema = z.object({
    id: idSchema,
    appointmentId: idSchema,
    amountKobo: z.number().int().nonnegative(),
    currency: z.literal("NGN"),
    status: PaymentStatus,
    providerRef: z.string().nullable(),
    payoutRef: z.string().nullable(),
});
export type Payment = z.infer<typeof paymentSchema>;

export const ledgerEntrySchema = z.object({
    id: idSchema,
    paymentId: idSchema,
    type: LedgerEntryType,
    amountKobo: z.number().int(),
    balanceAfterKobo: z.number().int(),
    note: z.string().nullable(),
    createdAt: z.string().datetime(),
});
export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;

export const refundRequestSchema = z.object({
    appointmentId: idSchema,
    reason: z.string(),
});

export const paystackWebhookSchema = z.object({
    event: z.string(),
    data: z.record(z.unknown()),
});