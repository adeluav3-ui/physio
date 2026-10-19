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

const BASE = "https://api.paystack.co";

export class PaystackProvider implements PaymentProvider {
    readonly name = "PAYSTACK" as const;

    constructor(private readonly secretKey: string) {
        if (!secretKey) throw new Error("PAYSTACK_SECRET_KEY is required");
    }

    private async call<T>(path: string, init?: RequestInit): Promise<T> {
        const res = await fetch(`${BASE}${path}`, {
            ...init,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.secretKey}`,
                ...(init?.headers ?? {}),
            },
        });
        const json = (await res.json().catch(() => ({}))) as {
            status?: boolean;
            message?: string;
            data?: T;
        };
        if (!res.ok || json.status === false) {
            throw new Error(`Paystack ${path} failed: ${res.status} ${json.message ?? ""}`);
        }
        return json.data as T;
    }

    async initializeCharge(input: InitChargeInput): Promise<InitChargeResult> {
        const data = await this.call<{ authorization_url: string; access_code: string; reference: string }>(
            "/transaction/initialize",
            {
                method: "POST",
                body: JSON.stringify({
                    email: input.email,
                    amount: input.amountKobo,
                    currency: input.currency,
                    reference: input.reference,
                    callback_url: input.callbackUrl,
                    metadata: input.metadata ?? {},
                }),
            },
        );
        return {
            authorizationUrl: data.authorization_url,
            accessCode: data.access_code,
            reference: data.reference,
        };
    }

    async verifyCharge(reference: string): Promise<VerifyResult> {
        const data = await this.call<{ status: string; amount: number; reference: string }>(
            `/transaction/verify/${encodeURIComponent(reference)}`,
        );
        const status =
            data.status === "success" ? "success" : data.status === "failed" ? "failed" : "pending";
        return {
            status,
            amountKobo: data.amount,
            reference: data.reference,
            raw: data as unknown as Record<string, unknown>,
        };
    }

    async createTransferRecipient(input: {
        name: string;
        accountNumber: string;
        bankCode: string;
    }): Promise<{ recipientCode: string }> {
        const data = await this.call<{ recipient_code: string }>("/transferrecipient", {
            method: "POST",
            body: JSON.stringify({
                type: "nuban",
                name: input.name,
                account_number: input.accountNumber,
                bank_code: input.bankCode,
                currency: "NGN",
            }),
        });
        return { recipientCode: data.recipient_code };
    }

    async transfer(input: TransferInput): Promise<TransferResult> {
        const data = await this.call<{ status: string; transfer_code: string; reference: string }>(
            "/transfer",
            {
                method: "POST",
                body: JSON.stringify({
                    source: "balance",
                    amount: input.amountKobo,
                    recipient: input.recipientCode,
                    reason: input.reason,
                    reference: input.reference,
                }),
            },
        );
        return {
            status: data.status === "success" ? "success" : data.status === "failed" ? "failed" : "pending",
            transferCode: data.transfer_code,
            reference: data.reference,
            raw: data as unknown as Record<string, unknown>,
        };
    }

    async refund(input: RefundInput): Promise<RefundResult> {
        const data = await this.call<{ status: string }>("/refund", {
            method: "POST",
            body: JSON.stringify({
                transaction: input.reference,
                amount: input.amountKobo,
            }),
        });
        return {
            status: data.status === "success" ? "success" : data.status === "failed" ? "failed" : "pending",
            raw: data as unknown as Record<string, unknown>,
        };
    }
}