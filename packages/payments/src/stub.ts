import type {
    InitChargeInput,
    InitChargeResult,
    PaymentProvider,
    RefundInput,
    RefundResult,
    TransferInput,
    TransferResult,
    VerifyResult,
} from "./types.js";

/**
 * Test-only stub returned when PAYSTACK_TEST_BYPASS=1.
 * Never make real HTTP calls; return deterministic fake data.
 * Only active in non-production environments.
 */
export class StubPaymentProvider implements PaymentProvider {
    readonly name = "PAYSTACK" as const;

    async initializeCharge(input: InitChargeInput): Promise<InitChargeResult> {
        return {
            authorizationUrl: `https://stub.paystack.test/pay/${input.reference}`,
            accessCode: `stub_access_${input.reference}`,
            reference: input.reference,
        };
    }

    async verifyCharge(reference: string): Promise<VerifyResult> {
        return {
            status: "success",
            amountKobo: 100000,
            reference,
            raw: { status: "success", stub: true },
        };
    }

    async createTransferRecipient(input: {
        name: string;
        accountNumber: string;
        bankCode: string;
    }): Promise<{ recipientCode: string }> {
        return { recipientCode: `stub_rcpt_${input.accountNumber}` };
    }

    async transfer(input: TransferInput): Promise<TransferResult> {
        return {
            status: "success",
            transferCode: `stub_trf_${input.reference}`,
            reference: input.reference,
            raw: { status: "success", stub: true },
        };
    }

    async refund(input: RefundInput): Promise<RefundResult> {
        return {
            status: "success",
            raw: { status: "success", reference: input.reference, stub: true },
        };
    }
}
