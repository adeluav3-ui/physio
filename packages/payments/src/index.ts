export type {
    PaymentProvider,
    InitChargeInput,
    InitChargeResult,
    VerifyResult,
    TransferInput,
    TransferResult,
    RefundInput,
    RefundResult,
} from "./types.js";
export { PaystackProvider } from "./paystack.js";

import { PaystackProvider } from "./paystack.js";
import type { PaymentProvider } from "./types.js";

export function getPaymentProvider(): PaymentProvider {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) throw new Error("PAYSTACK_SECRET_KEY missing");
    return new PaystackProvider(key);
}