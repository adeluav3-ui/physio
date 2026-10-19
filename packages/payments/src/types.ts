export type InitChargeInput = {
    email: string;
    amountKobo: number;
    currency: "NGN";
    reference: string;
    callbackUrl: string;
    metadata?: Record<string, unknown>;
};

export type InitChargeResult = {
    authorizationUrl: string;
    accessCode: string;
    reference: string;
};

export type VerifyResult = {
    status: "success" | "failed" | "pending";
    amountKobo: number;
    reference: string;
    raw: Record<string, unknown>;
};

export type TransferInput = {
    amountKobo: number;
    recipientCode: string;
    reason: string;
    reference: string;
};

export type TransferResult = {
    status: "success" | "failed" | "pending";
    transferCode: string;
    reference: string;
    raw: Record<string, unknown>;
};

export type RefundInput = {
    reference: string;
    amountKobo?: number;
};

export type RefundResult = {
    status: "success" | "failed" | "pending";
    raw: Record<string, unknown>;
};

export interface PaymentProvider {
    readonly name: "PAYSTACK" | "FLUTTERWAVE";
    initializeCharge(input: InitChargeInput): Promise<InitChargeResult>;
    verifyCharge(reference: string): Promise<VerifyResult>;
    createTransferRecipient(input: {
        name: string;
        accountNumber: string;
        bankCode: string;
    }): Promise<{ recipientCode: string }>;
    transfer(input: TransferInput): Promise<TransferResult>;
    refund(input: RefundInput): Promise<RefundResult>;
}