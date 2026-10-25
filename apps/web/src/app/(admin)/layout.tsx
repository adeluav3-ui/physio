import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";

const NAV = [
    { href: "/admin", label: "Home" },
    { href: "/admin/physios", label: "Verification" },
    { href: "/admin/users", label: "Users and professionals" },
    { href: "/admin/referrals", label: "Referrals" },
    { href: "/admin/payments", label: "Payments and ledger" },
    { href: "/admin/incidents", label: "Incidents and disputes" },
    { href: "/admin/library", label: "Library" },
    { href: "/admin/waitlist", label: "Waitlist" },
    { href: "/admin/audit", label: "Audit log" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const user = await getSession();
    if (!user) redirect("/auth/login");
    if (user.role !== "ADMIN") redirect(user.role === "PATIENT" ? "/app" : "/pro");

    return (
        <div style={{ display: "flex", flexWrap: "wrap", width: "100%", minHeight: "100dvh", fontFamily: "'Figtree',system-ui,sans-serif", color: "#12302c", background: "#f6f8f7" }}>
            <aside style={{ flex: "0 0 240px", background: "#fff", borderRight: "1px solid #dbe5e2", padding: "20px 16px", display: "flex", flexDirection: "column" }}>
                <div style={{ font: "700 20px 'Figtree',sans-serif", color: "#1b766e", padding: "0 12px 16px" }}>Rehab360 Admin</div>
                {NAV.map(n => (
                    <Link key={n.href} href={n.href} className="nav">{n.label}</Link>
                ))}
                <div style={{ marginTop: "auto", paddingTop: "16px" }}>
                    <div style={{ padding: "10px 12px", font: "400 13px 'Figtree',sans-serif", color: "#4f6663", borderTop: "1px solid #e6eeec", marginBottom: "8px" }}>
                        {user.name}
                    </div>
                    <SignOutButton className="btn btn2" style={{ width: "100%", minHeight: "40px" }} />
                </div>
            </aside>
            <main style={{ flex: "999 1 560px", minWidth: 0, padding: "28px" }}>
                {children}
            </main>
        </div>
    );
}
