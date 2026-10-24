"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS = [
    { label: "How it works", href: "#how" },
    { label: "For professionals", href: "#pros" },
    { label: "FAQ", href: "#faq" },
];

export default function LandingNav() {
    const [open, setOpen] = useState(false);

    return (
        <header style={{ borderBottom: "1px solid #dbe5e2", background: "#f6f8f7", position: "sticky", top: 0, zIndex: 100 }}>
            <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "0 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
                    {/* Logo */}
                    <a href="/" style={{ font: "700 22px 'Figtree',sans-serif", color: "#1b766e", textDecoration: "none" }}>Rehab360</a>

                    {/* Desktop nav */}
                    <nav style={{ display: "flex", gap: "24px", alignItems: "center", font: "500 15px 'Figtree',sans-serif" }}
                        className="landing-nav-desktop">
                        {LINKS.map(l => (
                            <a key={l.href} href={l.href} style={{ color: "#12302c", textDecoration: "none" }}>{l.label}</a>
                        ))}
                        <Link href="/auth/login" style={{ color: "#12302c", textDecoration: "none" }}>Log in</Link>
                        <Link href="/auth/signup" className="btn btn2" style={{ minHeight: "40px", padding: "0 18px" }}>Sign up</Link>
                        <a href="#join" className="btn" style={{ minHeight: "40px", padding: "0 18px" }}>Join waitlist</a>
                    </nav>

                    {/* Mobile hamburger */}
                    <button
                        type="button"
                        aria-label={open ? "Close menu" : "Open menu"}
                        className="landing-nav-burger"
                        onClick={() => setOpen(v => !v)}
                        style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: "6px", color: "#12302c" }}
                    >
                        {open ? (
                            /* X icon */
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        ) : (
                            /* Hamburger icon */
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile dropdown */}
            {open && (
                <div className="landing-nav-mobile" style={{ background: "#fff", borderTop: "1px solid #dbe5e2", padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {LINKS.map(l => (
                        <a key={l.href} href={l.href} onClick={() => setOpen(false)}
                            style={{ display: "block", padding: "12px 0", font: "500 16px 'Figtree',sans-serif", color: "#12302c", textDecoration: "none", borderBottom: "1px solid #f0f4f3" }}>
                            {l.label}
                        </a>
                    ))}
                    <a href="#join" onClick={() => setOpen(false)}
                        style={{ display: "block", padding: "12px 0", font: "500 16px 'Figtree',sans-serif", color: "#12302c", textDecoration: "none", borderBottom: "1px solid #f0f4f3" }}>
                        Join waitlist
                    </a>
                    <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                        <Link href="/auth/login" className="btn btn2" style={{ flex: 1, minHeight: "46px" }} onClick={() => setOpen(false)}>Log in</Link>
                        <Link href="/auth/signup" className="btn" style={{ flex: 1, minHeight: "46px" }} onClick={() => setOpen(false)}>Sign up</Link>
                    </div>
                </div>
            )}
        </header>
    );
}
