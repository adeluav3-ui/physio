"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

const IC_HOME = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 11l8-7 8 7v9H4z"/></svg>
);
const IC_PLAN = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 9h6M9 13h6"/></svg>
);
const IC_MSG = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>
);
const IC_VISITS = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>
);
const IC_ME = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 15-5 16 0"/></svg>
);

const TABS = [
    { href: "/app",              label: "Home",    icon: IC_HOME },
    { href: "/app/plan",         label: "Plan",    icon: IC_PLAN },
    { href: "/app/messages",     label: "Messages",icon: IC_MSG },
    { href: "/app/appointments", label: "Visits",  icon: IC_VISITS },
    { href: "/app/profile",      label: "Me",      icon: IC_ME },
] as const;

const IC_SIGNOUT = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
);

export default function PatientShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const isOnTab = (href: string) =>
        href === "/app" ? pathname === "/app" : pathname.startsWith(href);

    /* Onboarding, intake, session, triage: render without the phone shell */
    const bare = ["/app/onboarding", "/app/intake", "/app/session", "/app/triage", "/app/book", "/app/payments"].some(p => pathname.startsWith(p));
    if (bare) return <>{children}</>;

    return (
        <div style={{ maxWidth: "430px", margin: "0 auto", minHeight: "100dvh", background: "#f6f8f7", display: "flex", flexDirection: "column", fontFamily: "'Figtree',system-ui,sans-serif", color: "#12302c" }}>
            {/* Top bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "#fff", borderBottom: "1px solid #dbe5e2", position: "sticky", top: 0, zIndex: 10 }}>
                <span style={{ font: "700 18px 'Figtree',sans-serif", color: "#1b766e" }}>Rehab360</span>
                <SignOutButton style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", font: "500 13px 'Figtree',sans-serif", color: "#4f6663", padding: "4px 0" }}>
                    {IC_SIGNOUT} Sign out
                </SignOutButton>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
                {children}
            </div>
            <nav className="tabs">
                {TABS.map(t => (
                    <Link key={t.href} href={t.href} className={`tab${isOnTab(t.href) ? " tabon" : ""}`}>
                        {t.icon}
                        {t.label}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
