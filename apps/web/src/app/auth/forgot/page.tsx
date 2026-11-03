"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch("/api/proxy/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error((b as { message?: string }).message ?? "Request failed");
            }
            setDone(true);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ width: "100%", fontFamily: "'Figtree',system-ui,sans-serif", color: "#022449", background: "#f4f8fb", minHeight: "100dvh" }}>
            <div className="brand-strip" />
            <div style={{ padding: "32px 24px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100dvh - 5px)" }}>
                <div style={{ width: "100%", maxWidth: "440px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/brand/logo-horizontal-web.png" alt="Rehab360" style={{ height: "52px", width: "auto", display: "block", marginBottom: "24px" }} />
                    {done ? (
                        <div className="card" style={{ textAlign: "center" }}>
                            <h1 style={{ font: "700 28px 'Figtree',sans-serif" }}>Check your email</h1>
                            <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "10px" }}>
                                If an account exists for <strong>{email}</strong>, a reset link has been sent.
                            </p>
                            <Link href="/auth/login" className="btn btn2" style={{ display: "block", marginTop: "20px", textAlign: "center" }}>
                                Back to log in
                            </Link>
                        </div>
                    ) : (
                        <div className="card">
                            <h1 style={{ font: "700 28px 'Figtree',sans-serif" }}>Forgot your password?</h1>
                            <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>
                                Enter your email and we&apos;ll send you a reset link.
                            </p>
                            <form onSubmit={onSubmit} style={{ display: "grid", gap: "14px", marginTop: "20px" }}>
                                <div>
                                    <label className="flabel" htmlFor="f-email">Email</label>
                                    <input className="in" id="f-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
                                </div>
                                {error && <p style={{ color: "#8f1d1d", font: "400 14px 'Figtree',sans-serif", margin: 0 }}>{error}</p>}
                                <button type="submit" className="btn" disabled={loading} style={{ width: "100%", opacity: loading ? 0.7 : 1 }}>
                                    {loading ? "Sending…" : "Send reset link"}
                                </button>
                            </form>
                            <p style={{ textAlign: "center", font: "400 14px 'Figtree',sans-serif", marginTop: "16px", color: "#4f6478" }}>
                                <Link href="/auth/login">Back to log in</Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
