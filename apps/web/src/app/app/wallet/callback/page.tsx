"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type State = "verifying" | "credited" | "failed" | "timeout";

function Spinner() {
    return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ animation: "spin 0.9s linear infinite" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="24" cy="24" r="20" stroke="#d9e3ec" strokeWidth="4" />
            <path d="M44 24a20 20 0 0 0-20-20" stroke="#022449" strokeWidth="4" strokeLinecap="round" />
        </svg>
    );
}

function CallbackInner() {
    const router = useRouter();
    const params = useSearchParams();
    const ref = params.get("ref") ?? params.get("reference") ?? params.get("trxref");
    const [state, setState] = useState<State>("verifying");
    const attempts = useRef(0);

    useEffect(() => {
        if (!ref) { setState("failed"); return; }

        let cancelled = false;

        async function poll() {
            if (cancelled) return;
            attempts.current += 1;

            try {
                const res = await fetch(`/api/proxy/wallet/deposit/confirm?ref=${encodeURIComponent(ref!)}`);
                if (!res.ok) { if (!cancelled) setState("failed"); return; }
                const { status } = await res.json() as { status: string };

                if (status === "CREDITED") {
                    if (!cancelled) setState("credited");
                    setTimeout(() => { if (!cancelled) router.replace("/app/wallet"); }, 2500);
                    return;
                }

                if (attempts.current >= 8) {
                    if (!cancelled) setState("timeout");
                    return;
                }
                setTimeout(poll, 1500);
            } catch {
                if (!cancelled) setState("failed");
            }
        }

        void poll();
        return () => { cancelled = true; };
    }, [ref, router]);

    const wrap: React.CSSProperties = {
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#f4f8fb", fontFamily: "'Figtree',system-ui,sans-serif",
        color: "#022449", padding: "24px", textAlign: "center",
    };

    if (state === "verifying") return (
        <div style={wrap}>
            <Spinner />
            <h1 style={{ font: "700 22px 'Figtree',sans-serif", margin: "20px 0 8px" }}>Confirming your deposit…</h1>
            <p style={{ font: "400 15px 'Figtree',sans-serif", color: "#4f6478" }}>Please wait — this only takes a moment.</p>
        </div>
    );

    if (state === "credited") return (
        <div style={wrap}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#e3f4e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1b7d0e" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>
            <h1 style={{ font: "700 22px 'Figtree',sans-serif", margin: "20px 0 8px" }}>Funds added!</h1>
            <p style={{ font: "400 15px 'Figtree',sans-serif", color: "#4f6478" }}>Your wallet has been topped up. Redirecting you now…</p>
        </div>
    );

    if (state === "timeout") return (
        <div style={wrap}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fdf1d8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b97000" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
                </svg>
            </div>
            <h1 style={{ font: "700 22px 'Figtree',sans-serif", margin: "20px 0 8px" }}>Payment received</h1>
            <p style={{ font: "400 15px 'Figtree',sans-serif", color: "#4f6478", maxWidth: 340 }}>
                Your payment went through. Your wallet balance will update within a minute.
            </p>
            <button
                type="button"
                onClick={() => router.replace("/app/wallet")}
                style={{ marginTop: 20, padding: "12px 24px", borderRadius: 12, background: "#022449", color: "#fff", font: "600 15px 'Figtree',sans-serif", border: 0, cursor: "pointer" }}
            >
                Go to wallet
            </button>
        </div>
    );

    return (
        <div style={wrap}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fde8e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c90000" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
                </svg>
            </div>
            <h1 style={{ font: "700 22px 'Figtree',sans-serif", margin: "20px 0 8px" }}>Something went wrong</h1>
            <p style={{ font: "400 15px 'Figtree',sans-serif", color: "#4f6478", maxWidth: 340 }}>
                We could not confirm your deposit. If money was deducted, contact support with reference: <strong>{ref ?? "unknown"}</strong>
            </p>
            <button
                type="button"
                onClick={() => router.replace("/app/wallet")}
                style={{ marginTop: 20, padding: "12px 24px", borderRadius: 12, background: "#fff", color: "#022449", font: "600 15px 'Figtree',sans-serif", border: "1px solid #c3d1de", cursor: "pointer" }}
            >
                Go to wallet
            </button>
        </div>
    );
}

export default function WalletCallbackPage() {
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
