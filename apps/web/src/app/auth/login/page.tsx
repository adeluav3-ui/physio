"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema } from "@physio/shared";

function LoginForm() {
    const router = useRouter();
    const params = useSearchParams();
    const next = params.get("next");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
        setLoading(true);
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
            await fetch("/api/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: accessToken }),
            });
            const defaultDest = user.role === "PATIENT" ? "/app" : user.role === "PHYSIO" ? "/pro" : "/admin";
            router.push(next ?? defaultDest);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="card">
            <h2 style={{ font: "700 28px 'Figtree',sans-serif" }}>Welcome back</h2>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: "14px", marginTop: "24px" }}>
                <div><label className="flabel" htmlFor="l-email">Email</label><input className="in" id="l-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
                <div><label className="flabel" htmlFor="l-pass">Password</label><input className="in" id="l-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required /></div>
                <div style={{ textAlign: "right", font: "500 14px 'Figtree',sans-serif" }}>
                    <Link href="/auth/forgot">Forgot password?</Link>
                </div>
                {error && <p style={{ color: "#8f1d1d", font: "400 14px 'Figtree',sans-serif", margin: 0 }}>{error}</p>}
                <button type="submit" className="btn" disabled={loading} style={{ width: "100%", opacity: loading ? 0.7 : 1 }}>
                    {loading ? "Logging in…" : "Log in"}
                </button>
                <Link href="/auth/forgot" className="btn btn2" style={{ width: "100%", textAlign: "center" }}>
                    Email me a login link
                </Link>
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
