"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignOutButton } from "./sign-out-button";

const NAV = [
    { href: "/admin",                label: "Home" },
    { href: "/admin/physios",        label: "Verification" },
    { href: "/admin/users",          label: "Users & professionals" },
    { href: "/admin/appointments",   label: "Appointments" },
    { href: "/admin/referrals",      label: "Referrals" },
    { href: "/admin/payments",       label: "Payments & ledger" },
    { href: "/admin/incidents",      label: "Incidents" },
    { href: "/admin/library",        label: "Library" },
    { href: "/admin/waitlist",        label: "Waitlist" },
    { href: "/admin/fallback-cases",  label: "Fallback queue" },
    { href: "/admin/audit",           label: "Audit log" },
];

const IC_MENU = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
);
const IC_CLOSE = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);
const IC_SIGNOUT = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
);

export function AdminShell({ children, userName }: { children: React.ReactNode; userName: string }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const isActive = (href: string) =>
        href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

    const sidebarContent = (
        <>
            {/* Logo on white badge + ADMIN CONSOLE label */}
            <div style={{ padding: "0 0 18px" }}>
                <div className="admin-logo-badge">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/brand/logo-horizontal-web.png" alt="Rehab360" style={{ height: "34px", width: "auto", display: "block" }} />
                </div>
                <div className="admin-logo-label">ADMIN CONSOLE</div>
            </div>
            <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                {NAV.map(n => (
                    <Link
                        key={n.href}
                        href={n.href}
                        className={`nav${isActive(n.href) ? " navon" : ""}`}
                        onClick={() => setOpen(false)}
                    >
                        {n.label}
                    </Link>
                ))}
            </nav>
            <div style={{ paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ padding: "6px 12px 10px", font: "500 13px 'Figtree',sans-serif", color: "#9fc1e0" }}>
                    {userName}
                </div>
                <SignOutButton className="btn btn2" style={{ width: "100%", minHeight: "38px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                    {IC_SIGNOUT} Sign out
                </SignOutButton>
            </div>
        </>
    );

    return (
        <div className="admin-shell">
            {/* Mobile overlay */}
            {open && (
                <div className="admin-overlay" onClick={() => setOpen(false)} aria-hidden="true" />
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar${open ? " admin-sidebar-open" : ""}`}>
                {sidebarContent}
            </aside>

            {/* Right column: topbar (mobile only) + main content */}
            <div className="admin-body">
                <div className="admin-topbar">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/brand/logo-horizontal-web.png" alt="Rehab360" style={{ height: "30px", width: "auto" }} />
                    <button
                        type="button"
                        onClick={() => setOpen(v => !v)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#022449", display: "flex", alignItems: "center", padding: "6px" }}
                        aria-label={open ? "Close menu" : "Open menu"}
                        aria-expanded={open}
                    >
                        {open ? IC_CLOSE : IC_MENU}
                    </button>
                </div>
                <main className="admin-main">
                    {children}
                </main>
            </div>
        </div>
    );
}
