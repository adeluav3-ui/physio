"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

const IC_TODAY = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
);
const IC_SCHEDULE = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
    </svg>
);
const IC_PATIENTS = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="9" cy="8" r="3"/><path d="M3 21c0-4 2.7-7 6-7s6 3 6 7"/><circle cx="17" cy="9" r="2"/><path d="M21 21c0-2.8-1.8-5-4-5"/>
    </svg>
);
const IC_REFERRALS = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M17 3l4 4-4 4"/><path d="M3 7h18"/><path d="M7 21l-4-4 4-4"/><path d="M21 17H3"/>
    </svg>
);
const IC_MESSAGES = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M4 5h16v11H9l-5 4z"/>
    </svg>
);
const IC_ME = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 15-5 16 0"/>
    </svg>
);
const IC_AVAIL = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
    </svg>
);
const IC_WALLET = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/><circle cx="17" cy="15" r="1" fill="currentColor"/>
    </svg>
);
const IC_SIGNOUT = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
);

// Primary 5 tabs shown on mobile bottom bar
const PRIMARY_TABS = [
    { href: "/pro",              label: "Today",    icon: IC_TODAY },
    { href: "/pro/appointments", label: "Schedule", icon: IC_SCHEDULE },
    { href: "/pro/patients",     label: "Patients", icon: IC_PATIENTS },
    { href: "/pro/referrals",    label: "Referrals",icon: IC_REFERRALS },
    { href: "/pro/messages",     label: "Messages", icon: IC_MESSAGES },
] as const;

// Additional items only shown in desktop sidebar
const EXTRA_TABS = [
    { href: "/pro/availability", label: "Availability", icon: IC_AVAIL },
    { href: "/pro/wallet",       label: "Wallet",       icon: IC_WALLET },
    { href: "/pro/profile",      label: "My profile",   icon: IC_ME },
] as const;

const BARE = ["/pro/onboarding", "/pro/session"];

export default function ProShell({
    children,
    userName,
    discipline,
}: {
    children: React.ReactNode;
    userName?: string;
    discipline?: string;
}) {
    const pathname = usePathname();

    if (BARE.some(p => pathname.startsWith(p))) return <>{children}</>;

    const isActive = (href: string) =>
        href === "/pro" ? pathname === "/pro" : pathname.startsWith(href);

    return (
        <div className="app-shell">
            {/* 5 px brand strip */}
            <div className="brand-strip" />
            <div className="app-shell-inner">
                {/* Mobile top bar (hidden on desktop) */}
                <div className="app-topbar">
                    <div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/brand/logo-horizontal-web.png" alt="Rehab360" style={{ height: "28px", width: "auto", display: "block" }} />
                        {discipline && <div style={{ font: "400 12px 'Figtree',sans-serif", color: "#4f6478", marginTop: "2px" }}>{discipline}</div>}
                    </div>
                    <SignOutButton style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", font: "500 13px 'Figtree',sans-serif", color: "#4f6478", padding: "4px 0" }}>
                        {IC_SIGNOUT} Sign out
                    </SignOutButton>
                </div>

                {/* Main content — sits between topbar and bottom nav */}
                <div className="app-content">
                    <div className="pro-content">
                        {children}
                    </div>
                </div>

                {/* Nav — bottom bar on mobile (last child), left sidebar on desktop (order:-1) */}
                <nav className="tabs">
                    {/* Desktop only: logo + discipline */}
                    <div className="tabs-logo" aria-hidden="true">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/brand/logo-horizontal-web.png" alt="Rehab360" style={{ height: "38px", width: "auto", display: "block", marginBottom: "4px" }} />
                        {discipline && <div style={{ font: "400 12px 'Figtree',sans-serif", color: "#4f6478", padding: "0 10px 12px" }}>{discipline}</div>}
                    </div>

                    {PRIMARY_TABS.map(t => (
                        <Link key={t.href} href={t.href} className={`tab${isActive(t.href) ? " tabon" : ""}`}>
                            {t.icon}
                            {t.label}
                        </Link>
                    ))}

                    {/* Desktop only: extra nav items */}
                    {EXTRA_TABS.map(t => (
                        <Link key={t.href} href={t.href} className={`tab pro-tab-desktop-only${isActive(t.href) ? " tabon" : ""}`}>
                            {t.icon}
                            {t.label}
                        </Link>
                    ))}

                    {/* Desktop only: user info + sign out */}
                    <div className="tabs-footer">
                        {userName && (
                            <div style={{ padding: "4px 10px 10px", font: "500 13px 'Figtree',sans-serif", color: "#4f6478" }}>
                                {userName}
                            </div>
                        )}
                        <SignOutButton className="btn btn2" style={{ width: "100%", minHeight: "38px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                            {IC_SIGNOUT} Sign out
                        </SignOutButton>
                    </div>
                </nav>
            </div>
        </div>
    );
}
