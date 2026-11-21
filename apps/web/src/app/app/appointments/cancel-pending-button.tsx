"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelPendingButton({ appointmentId }: { appointmentId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    async function cancel() {
        setLoading(true);
        try {
            await fetch(`/api/proxy/booking/appointments/${encodeURIComponent(appointmentId)}/cancel`, {
                method: "POST",
                credentials: "include",
            });
            setDone(true);
            setTimeout(() => router.refresh(), 400);
        } catch {
            setLoading(false);
        }
    }

    if (done) return null;

    return (
        <button
            type="button"
            onClick={cancel}
            disabled={loading}
            className="mt-2 ml-4 text-sm font-medium text-red-600 underline"
            style={{ background: "none", border: "none", cursor: loading ? "default" : "pointer", padding: 0 }}
        >
            {loading ? "Cancelling…" : "Cancel booking"}
        </button>
    );
}
