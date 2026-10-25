"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
    const router = useRouter();
    const params = useSearchParams();
    const token = params.get("token");
    const email = params.get("email");
    const dev = params.get("dev") === "1";
    const next = params.get("next") ?? "/app";

    const [status, setStatus] = useState<"working" | "success" | "error">("working");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function verify() {
            try {
                if (dev) {
                    const res = await fetch("/api/proxy/auth/dev-verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email }),
                    });
                    if (!res.ok) {
                        const b = await res.json().catch(() => ({}));
                        throw new Error(b.message ?? "Dev verify failed");
                    }
                    setStatus("success");
                    return;
                }

                if (!token) throw new Error("Missing verification token");

                const res = await fetch("/api/proxy/auth/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });
                if (!res.ok) {
                    const b = await res.json().catch(() => ({}));
                    throw new Error(b.message ?? "Verification failed");
                }
                setStatus("success");
            } catch (err) {
                setError((err as Error).message);
                setStatus("error");
            }
        }
        verify();
    }, [token, email, dev]);

    if (status === "working") {
        return <p className="muted" style={{ font: "400 15px 'Figtree',sans-serif" }}>Verifying your email…</p>;
    }

    if (status === "success") {
        return (
            <>
                <h1 style={{ font: "700 28px 'Figtree',sans-serif" }}>Email verified</h1>
                <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "10px" }}>
                    Your account is active. Log in to continue.
                </p>
                <button
                    type="button"
                    className="btn"
                    style={{ width: "100%", marginTop: "20px" }}
                    onClick={() => router.push(`/auth/login?next=${encodeURIComponent(next)}`)}
                >
                    Go to log in
                </button>
            </>
        );
    }

    return (
        <>
            <h1 style={{ font: "700 28px 'Figtree',sans-serif", color: "#8f1d1d" }}>Verification failed</h1>
            <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "10px" }}>{error}</p>
            <Link href="/auth/login" className="btn btn2" style={{ width: "100%", textAlign: "center", marginTop: "20px", display: "block" }}>
                Back to log in
            </Link>
        </>
    );
}

export default function VerifyPage() {
    return (
        <div style={{ width: "100%", padding: "32px 24px", fontFamily: "'Figtree',system-ui,sans-serif", color: "#12302c", background: "#f6f8f7", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: "440px" }}>
                <div style={{ font: "700 22px 'Figtree',sans-serif", color: "#1b766e", marginBottom: "24px" }}>Rehab360</div>
                <div className="card" style={{ textAlign: "center" }}>
                    <Suspense fallback={<p className="muted" style={{ font: "400 15px 'Figtree',sans-serif" }}>Loading…</p>}>
                        <VerifyContent />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
