import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { requireSession } from "@/lib/session";

export default async function PaymentCallbackPage({
    searchParams,
}: {
    searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
    await requireSession(["PATIENT"]);
    const { reference, trxref } = await searchParams;
    const ref = reference ?? trxref;
    if (!ref) redirect("/app/appointments");

    // The webhook is the source of truth — this page just redirects after a short verify.
    try {
        const verify = await apiFetch<{ status: string }>(`/payments/verify/${encodeURIComponent(ref)}`);
        if (verify.status === "success") redirect("/app/appointments");
    } catch {
        // Fall through to appointments; webhook will catch up.
    }
    redirect("/app/appointments");
}