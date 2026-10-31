"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignOutButton } from "./sign-out-button";

const NAV = [
    { href: "/admin",           label: "Home" },
    { href: "/admin/physios",   label: "Verification" },
    { href: "/admin/users",     label: "Users & professionals" },
    { href: "/admin/referrals", label: "Referrals" },
    { href: "/admin/payments",  label: "Payments & ledger" },
    { href: "/admin/incidents", label: "Incidents" },
    { href: "/admin/library",   label: "Library" },
    { href: "/admin/waitlist",  label: "Waitlist" },
    { href: "/admin/audit",     label: "Audit log" },
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
            <div style={{ font: "700 20px 'Figtree',sans-serif", color: "#1b766e", padding: "0 10px 20px" }}>
                Rehab360
                <div style={{ font: "500 11px 'Figtree',sans-serif", color: "#4f6663", marginTop: "2px" }}>Admin panel</div>
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
            <div style={{ paddingTop: "14px", borderTop: "1px solid #e6eeec" }}>
                <div style={{ padding: "6px 12px 10px", font: "500 13px 'Figtree',sans-serif", color: "#4f6663" }}>
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
                    <span style={{ font: "700 17px 'Figtree',sans-serif", color: "#1b766e" }}>Rehab360 Admin</span>
                    <button
                        type="button"
                        onClick={() => setOpen(v => !v)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#12302c", display: "flex", alignItems: "center", padding: "6px" }}
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
