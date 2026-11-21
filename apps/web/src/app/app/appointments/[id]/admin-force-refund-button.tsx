"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminForceRefundButton({ appointmentId }: { appointmentId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleRefund() {
        if (!confirm("Force-refund this appointment to the patient's wallet?")) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/proxy/admin/payments/refund/${appointmentId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: "Admin force-refund" }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
            }
            setDone(true);
            router.refresh();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <div style={{ padding: "10px 14px", background: "#e6f4e1", borderRadius: 10, font: "500 13px 'Figtree',sans-serif", color: "#1b7d0e" }}>
                Refund credited to patient wallet.
            </div>
        );
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleRefund}
                disabled={loading}
                style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10, cursor: loading ? "default" : "pointer",
                    font: "600 13px 'Figtree',sans-serif", border: "1.5px solid #c90000",
                    background: "#fff0ef", color: "#c90000",
                }}
            >
                {loading ? "Processing…" : "Admin: Force refund to wallet"}
            </button>
            {error && (
                <div style={{ marginTop: 6, font: "400 12px 'Figtree',sans-serif", color: "#c90000" }}>
                    {error}
                </div>
            )}
        </div>
    );
}
