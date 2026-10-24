"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const LINKS = [
    { label: "How it works", href: "#how" },
    { label: "For professionals", href: "#pros" },
    { label: "FAQ", href: "#faq" },
];

type Dest = "login" | "signup";

export default function LandingNav() {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [modal, setModal] = useState<Dest | null>(null);
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    function openModal(dest: Dest) {
        setMenuOpen(false);
        setCode("");
        setError(null);
        setModal(dest);
    }

    function closeModal() {
        setModal(null);
        setCode("");
        setError(null);
    }

    async function submitCode(e: React.FormEvent) {
        e.preventDefault();
        if (!code.trim()) { setError("Please enter the access code."); return; }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: code.trim() }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setError(data.error ?? "Incorrect access code. Please try again.");
                return;
            }
            // Cookie is now set — navigate to the intended auth page
            router.push(`/auth/${modal}`);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <header style={{ borderBottom: "1px solid #dbe5e2", background: "#f6f8f7", position: "sticky", top: 0, zIndex: 100 }}>
                <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "0 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
                        {/* Logo */}
                        <a href="/" style={{ font: "700 22px 'Figtree',sans-serif", color: "#1b766e", textDecoration: "none" }}>Rehab360</a>

                        {/* Desktop nav */}
                        <nav className="landing-nav-desktop" style={{ display: "flex", gap: "24px", alignItems: "center", font: "500 15px 'Figtree',sans-serif" }}>
                            {LINKS.map(l => (
                                <a key={l.href} href={l.href} style={{ color: "#12302c", textDecoration: "none" }}>{l.label}</a>
                            ))}
                            <button type="button" onClick={() => openModal("login")}
                                style={{ background: "none", border: "none", cursor: "pointer", font: "500 15px 'Figtree',sans-serif", color: "#12302c", padding: 0 }}>
                                Log in
                            </button>
                            <button type="button" onClick={() => openModal("signup")} className="btn btn2"
                                style={{ minHeight: "40px", padding: "0 18px" }}>
                                Sign up
                            </button>
                            <a href="#join" className="btn" style={{ minHeight: "40px", padding: "0 18px" }}>Join waitlist</a>
                        </nav>

                        {/* Mobile hamburger */}
                        <button type="button" aria-label={menuOpen ? "Close menu" : "Open menu"}
                            className="landing-nav-burger"
                            onClick={() => setMenuOpen(v => !v)}
                            style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: "6px", color: "#12302c" }}>
                            {menuOpen ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile dropdown */}
                {menuOpen && (
                    <div className="landing-nav-mobile" style={{ background: "#fff", borderTop: "1px solid #dbe5e2", padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {LINKS.map(l => (
                            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                                style={{ display: "block", padding: "12px 0", font: "500 16px 'Figtree',sans-serif", color: "#12302c", textDecoration: "none", borderBottom: "1px solid #f0f4f3" }}>
                                {l.label}
                            </a>
                        ))}
                        <a href="#join" onClick={() => setMenuOpen(false)}
                            style={{ display: "block", padding: "12px 0", font: "500 16px 'Figtree',sans-serif", color: "#12302c", textDecoration: "none", borderBottom: "1px solid #f0f4f3" }}>
                            Join waitlist
                        </a>
                        <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                            <button type="button" className="btn btn2" style={{ flex: 1, minHeight: "46px" }} onClick={() => openModal("login")}>Log in</button>
                            <button type="button" className="btn" style={{ flex: 1, minHeight: "46px" }} onClick={() => openModal("signup")}>Sign up</button>
                        </div>
                    </div>
                )}
            </header>

            {/* Access-code modal */}
            {modal && (
                <div
                    role="dialog" aria-modal="true" aria-labelledby="modal-title"
                    onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
                    style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(18,48,44,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                    <div style={{ background: "#fff", borderRadius: "20px", padding: "36px 32px", width: "100%", maxWidth: "420px", fontFamily: "'Figtree',system-ui,sans-serif", color: "#12302c", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
                        <div style={{ font: "700 22px 'Figtree',sans-serif" }} id="modal-title">
                            {modal === "login" ? "Log in to Rehab360" : "Create your account"}
                        </div>
                        <p style={{ font: "400 15px/1.55 'Figtree',sans-serif", color: "#4f6663", marginTop: "8px" }}>
                            Rehab360 is in early access. Enter the access code to continue.
                        </p>

                        <form onSubmit={submitCode} style={{ marginTop: "24px", display: "grid", gap: "14px" }}>
                            <div>
                                <label htmlFor="access-code" style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Access code</label>
                                <input
                                    id="access-code"
                                    type="password"
                                    className="in"
                                    placeholder="Enter your access code"
                                    value={code}
                                    onChange={e => { setCode(e.target.value); setError(null); }}
                                    autoFocus
                                    autoComplete="off"
                                />
                            </div>

                            {error && (
                                <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#fde8e8", color: "#8f1d1d", font: "400 14px 'Figtree',sans-serif" }}>
                                    {error}
                                </div>
                            )}

                            <button type="submit" className="btn" style={{ width: "100%", minHeight: "48px" }} disabled={loading}>
                                {loading ? "Checking…" : modal === "login" ? "Continue to log in" : "Continue to sign up"}
                            </button>
                            <button type="button" className="btn btn2" style={{ width: "100%", minHeight: "44px" }} onClick={closeModal}>
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
