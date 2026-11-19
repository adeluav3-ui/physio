"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

type State = "verifying" | "confirmed" | "failed" | "timeout";

function Spinner() {
    return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ animation: "spin 0.9s linear infinite" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="24" cy="24" r="20" stroke="#d9e3ec" strokeWidth="4" />
            <path d="M44 24a20 20 0 0 0-20-20" stroke="#1b7d0e" strokeWidth="4" strokeLinecap="round" />
        </svg>
    );
}

function CallbackInner() {
    const router = useRouter();
    const params = useSearchParams();
    const reference = params.get("reference") ?? params.get("trxref");
    const [state, setState] = useState<State>("verifying");
    const attempts = useRef(0);

    useEffect(() => {
        if (!reference) { setState("failed"); return; }

        let cancelled = false;

        async function poll() {
            if (cancelled) return;
            attempts.current += 1;

            try {
                const res = await fetch(`/api/proxy/payments/confirm-callback/${encodeURIComponent(reference!)}`);
                if (!res.ok) { setState("failed"); return; }
                const { status } = await res.json() as { status: string };

                if (status === "CONFIRMED") {
                    if (!cancelled) setState("confirmed");
                    setTimeout(() => { if (!cancelled) router.replace("/app/appointments"); }, 2500);
                    return;
                }

                // Still pending — retry up to 8 times (~16 s total)
                if (attempts.current >= 8) {
                    if (!cancelled) setState("timeout");
                    return;
                }
                setTimeout(poll, 2000);
            } catch {
                if (!cancelled) setState("failed");
            }
        }

        void poll();
        return () => { cancelled = true; };
    }, [reference, router]);

    const wrap: React.CSSProperties = {
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#f4f8fb", fontFamily: "'Figtree',system-ui,sans-serif",
        color: "#022449", padding: "24px", textAlign: "center",
    };

    if (state === "verifying") return (
        <div style={wrap}>
            <Spinner />
            <h1 style={{ font: "700 22px 'Figtree',sans-serif", margin: "20px 0 8px" }}>Confirming your payment…</h1>
            <p style={{ font: "400 15px 'Figtree',sans-serif", color: "#4f6478" }}>Please wait — this only takes a moment.</p>
        </div>
    );

    if (state === "confirmed") return (
        <div style={wrap}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#e3f4e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1b7d0e" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>
            <h1 style={{ font: "700 22px 'Figtree',sans-serif", margin: "20px 0 8px" }}>Booking confirmed!</h1>
            <p style={{ font: "400 15px 'Figtree',sans-serif", color: "#4f6478" }}>Your appointment is booked. Redirecting you now…</p>
        </div>
    );

    if (state === "timeout") return (
        <div style={wrap}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fdf1d8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b97000" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
                </svg>
            </div>
            <h1 style={{ font: "700 22px 'Figtree',sans-serif", margin: "20px 0 8px" }}>Payment received</h1>
            <p style={{ font: "400 15px 'Figtree',sans-serif", color: "#4f6478", maxWidth: "340px" }}>
                Your payment went through. Your appointment will show up within a minute.
            </p>
            <button
                type="button"
                onClick={() => router.replace("/app/appointments")}
                style={{ marginTop: "20px", padding: "12px 24px", borderRadius: "12px", background: "#1b7d0e", color: "#fff", font: "600 15px 'Figtree',sans-serif", border: 0, cursor: "pointer" }}
            >
                View my appointments
            </button>
        </div>
    );

    return (
        <div style={wrap}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fde8e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c90000" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
                </svg>
            </div>
            <h1 style={{ font: "700 22px 'Figtree',sans-serif", margin: "20px 0 8px" }}>Something went wrong</h1>
            <p style={{ font: "400 15px 'Figtree',sans-serif", color: "#4f6478", maxWidth: "340px" }}>
                We could not confirm your payment. If money was deducted, contact support with reference: <strong>{reference ?? "unknown"}</strong>
            </p>
            <button
                type="button"
                onClick={() => router.replace("/app/appointments")}
                style={{ marginTop: "20px", padding: "12px 24px", borderRadius: "12px", background: "#fff", color: "#022449", font: "600 15px 'Figtree',sans-serif", border: "1px solid #c3d1de", cursor: "pointer" }}
            >
                Go to appointments
            </button>
        </div>
    );
}

export default function PaymentCallbackPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f8fb" }}>
                <Spinner />
            </div>
        }>
            <CallbackInner />
        </Suspense>
    );
}
