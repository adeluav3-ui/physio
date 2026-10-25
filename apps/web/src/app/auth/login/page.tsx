"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema } from "@physio/shared";

const IC_EYE = (show: boolean) => show ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
);

function LoginForm() {
    const router = useRouter();
    const params = useSearchParams();
    const next = params.get("next");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
        setLoading(true);
        setStatus("Logging in…");
        try {
            const res = await fetch("/api/proxy/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed.data),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message ?? "Login failed");
            }
            const { accessToken, user } = await res.json();

            if (user.role === "PHYSIO") {
                // Set cookie then navigate — no extra API call needed
                setStatus("Opening your dashboard…");
                await fetch("/api/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: accessToken }),
                });
                router.push(next ?? "/pro");
            } else if (user.role === "ADMIN") {
                setStatus("Opening admin panel…");
                await fetch("/api/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: accessToken }),
                });
                router.push(next ?? "/admin");
            } else {
                // PATIENT — run session write + physio profile check in parallel
                setStatus("Opening your dashboard…");
                const [, proRes] = await Promise.all([
                    fetch("/api/session", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ token: accessToken }),
                    }),
                    // Only check for pending professional profile when next isn't already set
                    !next
                        ? fetch(`/api/proxy/physios/${user.id}`).catch(() => null)
                        : Promise.resolve(null),
                ]);

                if (!next && proRes?.ok) {
                    router.push("/pro/onboarding/pending");
                } else {
                    router.push(next ?? "/app");
                }
            }
        } catch (err) {
            setError((err as Error).message);
            setStatus("");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="card">
            <h2 style={{ font: "700 28px 'Figtree',sans-serif" }}>Welcome back</h2>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: "14px", marginTop: "24px" }}>
                <div><label className="flabel" htmlFor="l-email">Email</label><input className="in" id="l-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required /></div>
                <div>
                    <label className="flabel" htmlFor="l-pass">Password</label>
                    <div style={{ position: "relative" }}>
                        <input className="in" id="l-pass" type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" required style={{ paddingRight: "44px" }} />
                        <button type="button" onClick={() => setShowPass(v => !v)} aria-label={showPass ? "Hide password" : "Show password"}
                            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4f6663", display: "flex", alignItems: "center", padding: 0 }}>
                            {IC_EYE(showPass)}
                        </button>
                    </div>
                </div>
                <div style={{ textAlign: "right", font: "500 14px 'Figtree',sans-serif" }}>
                    <Link href="/auth/forgot">Forgot password?</Link>
                </div>
                {error && <p style={{ color: "#8f1d1d", font: "400 14px 'Figtree',sans-serif", margin: 0 }}>{error}</p>}
                <button type="submit" className="btn" disabled={loading} style={{ width: "100%", opacity: loading ? 0.7 : 1 }}>
                    {status || "Log in"}
                </button>
            </form>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div style={{ width: "100%", padding: "32px 24px", fontFamily: "'Figtree',system-ui,sans-serif", color: "#12302c", background: "#f6f8f7", minHeight: "100dvh" }}>
            <div style={{ maxWidth: "520px", margin: "0 auto" }}>
                <div style={{ font: "700 22px 'Figtree',sans-serif", color: "#1b766e", marginBottom: "24px" }}>Rehab360</div>
                <Suspense fallback={<div className="card" style={{ textAlign: "center", padding: "40px" }}>Loading…</div>}>
                    <LoginForm />
                </Suspense>
                <p style={{ textAlign: "center", font: "400 14px 'Figtree',sans-serif", marginTop: "16px", color: "#4f6663" }}>
                    New here? <Link href="/auth/signup">Create an account</Link>
                </p>
            </div>
        </div>
    );
}
