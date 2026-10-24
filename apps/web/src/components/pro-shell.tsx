"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
    { label: "Home", href: "/pro" },
    { label: "Patients", href: "/pro/patients" },
    { label: "Calendar", href: "/pro/appointments" },
    { label: "Referrals", href: "/pro/referrals" },
    { label: "Messages", href: "/pro/messages" },
    { label: "Earnings", href: "/pro/earnings" },
    { label: "Profile", href: "/pro/profile" },
];

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
    const path = usePathname();
    if (BARE.some(p => path.startsWith(p))) return <>{children}</>;

    return (
        <div style={{ display: "flex", flexWrap: "wrap", width: "100%", minHeight: "100dvh", fontFamily: "'Figtree',system-ui,sans-serif", color: "#12302c", background: "#f6f8f7" }}>
            <aside style={{ flex: "0 0 240px", background: "#fff", borderRight: "1px solid #dbe5e2", padding: "20px 16px", display: "flex", flexDirection: "column" }}>
                <div style={{ font: "700 20px 'Figtree',sans-serif", color: "#1b766e", padding: "0 12px 16px" }}>Rehab360</div>
                {NAV.map(n => {
                    const on = n.href === "/pro" ? path === "/pro" : path.startsWith(n.href);
                    return (
                        <Link key={n.href} href={n.href} className={`nav${on ? " navon" : ""}`}>{n.label}</Link>
                    );
                })}
                {userName && (
                    <div style={{ marginTop: "auto", padding: "12px", borderRadius: "12px", background: "#f1f6f5" }}>
                        <div style={{ font: "600 14px 'Figtree',sans-serif" }}>{userName}</div>
                        {discipline && <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif" }}>{discipline}</div>}
                    </div>
                )}
            </aside>
            <main style={{ flex: "999 1 560px", minWidth: 0, padding: "28px" }}>
                {children}
            </main>
        </div>
    );
}
