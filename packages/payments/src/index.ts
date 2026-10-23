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
export { StubPaymentProvider } from "./stub.js";

import { PaystackProvider } from "./paystack.js";
import { StubPaymentProvider } from "./stub.js";
import type { PaymentProvider } from "./types.js";

export function getPaymentProvider(): PaymentProvider {
    if (process.env.PAYSTACK_TEST_BYPASS === "1" && process.env.NODE_ENV !== "production") {
        return new StubPaymentProvider();
    }
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) throw new Error("PAYSTACK_SECRET_KEY missing");
    return new PaystackProvider(key);
}