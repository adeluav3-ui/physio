"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUpSchema, DISCIPLINE_LABELS } from "@physio/shared";

const IC_EYE = (show: boolean) => show ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
);

type Discipline = keyof typeof DISCIPLINE_LABELS;
const DISCIPLINES = Object.entries(DISCIPLINE_LABELS) as [Discipline, string][];


export default function SignupPage() {
    const router = useRouter();
    const [role, setRole] = useState<"patient" | "pro">("patient");
    const [discipline, setDiscipline] = useState<Discipline>("PHYSIOTHERAPY");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (role === "pro" && !discipline) { setError("Please select your discipline."); return; }
        if (!agreed) { setError("Please agree to the terms and privacy notice."); return; }
        const parsed = signUpSchema.safeParse({ email, password, name });
        if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
        setLoading(true);
        try {
            const res = await fetch("/api/proxy/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed.data),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message ?? "Signup failed");
            }
            setDone(true);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        const nextPath = role === "pro"
            ? `/pro/onboarding/apply?discipline=${discipline}`
            : "/app";
        return (
            <div style={{ width: "100%", padding: "32px 24px", fontFamily: "'Figtree',system-ui,sans-serif", color: "#12302c", background: "#f6f8f7", minHeight: "100dvh" }}>
                <div style={{ maxWidth: "520px", margin: "0 auto" }}>
                    <div style={{ font: "700 22px 'Figtree',sans-serif", color: "#1b766e", marginBottom: "24px" }}>Rehab360</div>
                    <div className="card">
                        <h1 style={{ font: "700 28px 'Figtree',sans-serif" }}>Check your email</h1>
                        <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "10px" }}>
                            We sent a verification link to <strong>{email}</strong>. Click it to activate your account, then log in.
                        </p>
                        <div style={{ display: "grid", gap: "12px", marginTop: "20px" }}>
                            <button
                                type="button"
                                className="btn"
                                style={{ width: "100%" }}
                                onClick={() => router.push(`/auth/verify?email=${encodeURIComponent(email)}&dev=1&next=${encodeURIComponent(nextPath)}`)}
                            >
                                Verify now (dev)
                            </button>
                            <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`} className="btn btn2" style={{ width: "100%", textAlign: "center" }}>
                                Go to log in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: "100%", padding: "32px 24px", fontFamily: "'Figtree',system-ui,sans-serif", color: "#12302c", background: "#f6f8f7", minHeight: "100dvh" }}>
            <div style={{ maxWidth: "520px", margin: "0 auto" }}>
                <div style={{ font: "700 22px 'Figtree',sans-serif", color: "#1b766e", marginBottom: "24px" }}>Rehab360</div>
                <div className="card">
                    <h1 style={{ font: "700 28px 'Figtree',sans-serif" }}>Create your account</h1>
                    <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>We send appointment reminders and messages to your email.</p>

                    {/* Role toggle */}
                    <div style={{ display: "flex", gap: "8px", margin: "20px 0 0" }}>
                        <button
                            type="button"
                            onClick={() => setRole("patient")}
                            style={{ flex: 1, padding: "11px", textAlign: "center", borderRadius: "10px", border: 0, cursor: "pointer", background: role === "patient" ? "#1b766e" : "#f1f6f5", color: role === "patient" ? "#fff" : "#12302c", font: "600 14px 'Figtree',sans-serif" }}
                        >
                            I need care
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole("pro")}
                            style={{ flex: 1, padding: "11px", textAlign: "center", borderRadius: "10px", border: 0, cursor: "pointer", background: role === "pro" ? "#1b766e" : "#f1f6f5", color: role === "pro" ? "#fff" : "#12302c", font: "600 14px 'Figtree',sans-serif" }}
                        >
                            I provide care
                        </button>
                    </div>

                    {/* Discipline selector — only for professionals */}
                    {role === "pro" && (
                        <div style={{ marginTop: "18px" }}>
                            <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "10px" }}>
                                Select your discipline
                            </label>
                            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px" }}>
                                {DISCIPLINES.map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setDiscipline(key)}
                                        style={{
                                            flex: "1 1 140px",
                                            padding: "12px 10px",
                                            borderRadius: "12px",
                                            border: discipline === key ? "2px solid #1b766e" : "1.5px solid #c5d3cf",
                                            background: discipline === key ? "#e3f1ef" : "#fff",
                                            color: discipline === key ? "#14544e" : "#12302c",
                                            font: "600 13px 'Figtree',sans-serif",
                                            cursor: "pointer",
                                            textAlign: "center" as const,
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <form onSubmit={onSubmit} style={{ display: "grid", gap: "14px", marginTop: "20px" }}>
                        <div><label className="flabel" htmlFor="s-name">Full name</label><input className="in" id="s-name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required /></div>
                        <div><label className="flabel" htmlFor="s-email">Email</label><input className="in" id="s-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
                        <div>
                            <label className="flabel" htmlFor="s-pass">Password</label>
                            <div style={{ position: "relative" }}>
                                <input className="in" id="s-pass" type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Choose a password" required style={{ paddingRight: "44px" }} />
                                <button type="button" onClick={() => setShowPass(v => !v)} aria-label={showPass ? "Hide password" : "Show password"}
                                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4f6663", display: "flex", alignItems: "center", padding: 0 }}>
                                    {IC_EYE(showPass)}
                                </button>
                            </div>
                        </div>
                        <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", font: "400 14px/1.4 'Figtree',sans-serif", margin: 0, cursor: "pointer" }}>
                            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: "20px", height: "20px", margin: 0, flexShrink: 0, marginTop: "1px" }} />
                            I agree to the terms and privacy notice.
                        </label>
                        {error && <p style={{ color: "#8f1d1d", font: "400 14px 'Figtree',sans-serif", margin: 0 }}>{error}</p>}
                        <button type="submit" className="btn" disabled={loading} style={{ width: "100%", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Creating…" : "Create account"}
                        </button>
                        <p className="muted" style={{ font: "400 14px 'Figtree',sans-serif", textAlign: "center", margin: 0 }}>
                            Already have an account? <Link href="/auth/login">Log in</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
