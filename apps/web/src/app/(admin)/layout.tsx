import { redirect } from "next/navigation";
import Link from "next/link";
import { BRAND } from "@physio/shared";
import { getSession } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/physios", label: "Professionals" },
  { href: "/admin/referrals", label: "Referrals" },
  { href: "/admin/triage", label: "Triage" },
  { href: "/admin/appointments", label: "Appointments" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/home-visits", label: "Home visits" },
  { href: "/admin/library", label: "Library" },
  { href: "/admin/incidents", label: "Incidents" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/waitlist", label: "Waitlist" },
  { href: "/admin/audit", label: "Audit log" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/auth/login");
  if (user.role !== "ADMIN") redirect(user.role === "PATIENT" ? "/app" : "/pro");

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-64 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="text-lg font-semibold">{BRAND.name} Admin</span>
          <SignOutButton />
        </div>
        <nav className="flex-1 p-2">
          <ul className="flex flex-col gap-1">
            {nav.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-text-muted hover:bg-neutral-100 hover:text-text"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}