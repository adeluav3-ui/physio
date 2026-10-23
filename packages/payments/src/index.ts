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
    const env = process.env.NODE_ENV;
    const bypass = process.env.PAYSTACK_TEST_BYPASS === "1";
    if (bypass && (env === "test" || env === "development")) {
        return new StubPaymentProvider();
    }
    if (bypass) {
        throw new Error(
            `PAYSTACK_TEST_BYPASS=1 is not allowed in NODE_ENV="${env}" (only "test" or "development")`,
        );
    }
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) throw new Error("PAYSTACK_SECRET_KEY missing");
    return new PaystackProvider(key);
}