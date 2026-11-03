"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetContent() {
    const router = useRouter();
    const params = useSearchParams();
    const token = params.get("token");

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!token) { setError("Missing reset token. Open the link from your email."); return; }
        if (password !== confirm) { setError("Passwords do not match"); return; }
        if (password.length < 10) { setError("Password must be at least 10 characters"); return; }

        setLoading(true);
        try {
            const res = await fetch("/api/proxy/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error((b as { message?: string }).message ?? "Reset failed");
            }
            setDone(true);
            setTimeout(() => router.push("/auth/login"), 1500);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <div className="card" style={{ textAlign: "center" }}>
                <h1 style={{ font: "700 28px 'Figtree',sans-serif" }}>Password updated</h1>
                <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "10px" }}>
                    Redirecting to log in…
                </p>
            </div>
        );
    }

    return (
        <div className="card">
            <h1 style={{ font: "700 28px 'Figtree',sans-serif" }}>Set a new password</h1>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: "14px", marginTop: "20px" }}>
                <div>
                    <label className="flabel" htmlFor="r-pass">New password</label>
                    <input className="in" id="r-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 10 characters" required autoComplete="new-password" />
                    <p className="muted" style={{ font: "400 13px 'Figtree',sans-serif", marginTop: "4px" }}>At least 10 characters, with a letter and a number</p>
                </div>
                <div>
                    <label className="flabel" htmlFor="r-confirm">Confirm new password</label>
                    <input className="in" id="r-confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" required autoComplete="new-password" />
                </div>
                {error && <p style={{ color: "#8f1d1d", font: "400 14px 'Figtree',sans-serif", margin: 0 }}>{error}</p>}
                <button type="submit" className="btn" disabled={loading} style={{ width: "100%", opacity: loading ? 0.7 : 1 }}>
                    {loading ? "Saving…" : "Save new password"}
                </button>
            </form>
            <p style={{ textAlign: "center", font: "400 14px 'Figtree',sans-serif", marginTop: "16px", color: "#4f6478" }}>
                <Link href="/auth/login">Back to log in</Link>
            </p>
        </div>
    );
}

export default function ResetPage() {
    return (
        <div style={{ width: "100%", fontFamily: "'Figtree',system-ui,sans-serif", color: "#022449", background: "#f4f8fb", minHeight: "100dvh" }}>
            <div className="brand-strip" />
            <div style={{ padding: "32px 24px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100dvh - 5px)" }}>
                <div style={{ width: "100%", maxWidth: "440px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/brand/logo-horizontal-web.png" alt="Rehab360" style={{ height: "52px", width: "auto", display: "block", marginBottom: "24px" }} />
                    <Suspense fallback={<div className="card" style={{ textAlign: "center", padding: "40px" }}>Loading…</div>}>
                        <ResetContent />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
