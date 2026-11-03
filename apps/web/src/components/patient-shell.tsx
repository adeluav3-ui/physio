"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

const IC_HOME = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 11l8-7 8 7v9H4z"/></svg>
);
const IC_PLAN = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 9h6M9 13h6"/></svg>
);
const IC_MSG = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>
);
const IC_VISITS = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>
);
const IC_ME = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 15-5 16 0"/></svg>
);
const IC_SIGNOUT = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
);

const TABS = [
    { href: "/app",              label: "Home",    icon: IC_HOME },
    { href: "/app/plan",         label: "Plan",    icon: IC_PLAN },
    { href: "/app/messages",     label: "Messages",icon: IC_MSG },
    { href: "/app/appointments", label: "Visits",  icon: IC_VISITS },
    { href: "/app/profile",      label: "Me",      icon: IC_ME },
] as const;

export default function PatientShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const isActive = (href: string) =>
        href === "/app" ? pathname === "/app" : pathname.startsWith(href);

    const bare = ["/app/onboarding", "/app/intake", "/app/session", "/app/triage", "/app/book", "/app/payments"].some(p => pathname.startsWith(p));
    if (bare) return <>{children}</>;

    return (
        <div className="app-shell">
            {/* 5 px brand strip */}
            <div className="brand-strip" />
            <div className="app-shell-inner">
                {/* Mobile top bar (hidden on desktop) */}
                <div className="app-topbar">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/brand/logo-horizontal-web.png" alt="Rehab360" style={{ height: "28px", width: "auto" }} />
                    <SignOutButton style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", font: "500 13px 'Figtree',sans-serif", color: "#4f6478", padding: "4px 0" }}>
                        {IC_SIGNOUT} Sign out
                    </SignOutButton>
                </div>

                {/* Main content — sits between topbar and bottom nav */}
                <div className="app-content">
                    {children}
                </div>

                {/* Nav — bottom bar on mobile (last child), left sidebar on desktop (order:-1) */}
                <nav className="tabs">
                    {/* Desktop only: logo */}
                    <div className="tabs-logo" aria-hidden="true">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/brand/logo-horizontal-web.png" alt="Rehab360" style={{ height: "34px", width: "auto", display: "block" }} />
                    </div>

                    {TABS.map(t => (
                        <Link key={t.href} href={t.href} className={`tab${isActive(t.href) ? " tabon" : ""}`}>
                            {t.icon}
                            {t.label}
                        </Link>
                    ))}

                    {/* Desktop only: sign out */}
                    <div className="tabs-footer">
                        <SignOutButton className="btn btn2" style={{ width: "100%", minHeight: "38px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                            {IC_SIGNOUT} Sign out
                        </SignOutButton>
                    </div>
                </nav>
            </div>
        </div>
    );
}
