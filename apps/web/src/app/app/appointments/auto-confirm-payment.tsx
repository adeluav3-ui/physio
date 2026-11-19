"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type State = "confirming" | "confirmed" | "failed";

export function AutoConfirmPayment({ appointmentId }: { appointmentId: string }) {
    const router = useRouter();
    const [state, setState] = useState<State>("confirming");
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function run() {
            try {
                const res = await fetch(
                    `/api/proxy/payments/appointments/${encodeURIComponent(appointmentId)}/confirm`,
                    { credentials: "include" },
                );
                if (cancelled) return;
                if (!res.ok) { setState("failed"); return; }

                const { status } = await res.json() as { status: string };
                if (cancelled) return;

                if (status === "CONFIRMED") {
                    setState("confirmed");
                    setTimeout(() => { if (!cancelled) router.refresh(); }, 800);
                } else if (status === "PENDING_PAYMENT") {
                    // Payment not yet settled on Paystack side — retry up to 6 times
                    setAttempts((n) => {
                        if (n >= 6) { setState("failed"); return n; }
                        setTimeout(run, 3000);
                        return n + 1;
                    });
                } else {
                    // Already confirmed under a different status name (CONFIRMED, etc.)
                    setState("confirmed");
                    setTimeout(() => { if (!cancelled) router.refresh(); }, 800);
                }
            } catch {
                if (!cancelled) setState("failed");
            }
        }

        void run();
        return () => { cancelled = true; };
    }, [appointmentId, router]);

    if (state === "confirmed") {
        return (
            <p className="mt-2 text-sm font-medium text-green-700">
                Confirmed! Refreshing…
            </p>
        );
    }

    if (state === "failed") {
        return (
            <div className="mt-2">
                <p className="text-sm text-red-600">
                    Could not auto-confirm. Tap below to retry.
                </p>
                <button
                    type="button"
                    onClick={() => { setState("confirming"); setAttempts(0); }}
                    className="mt-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white"
                >
                    Retry confirmation
                </button>
            </div>
        );
    }

    return (
        <p className="mt-2 flex items-center gap-2 text-sm text-amber-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" style={{ animation: "spin 0.9s linear infinite", flexShrink: 0 }}>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Confirming your booking…
        </p>
    );
}
