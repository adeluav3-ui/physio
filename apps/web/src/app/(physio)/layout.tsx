import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/pro", label: "Today" },
  { href: "/pro/appointments", label: "Schedule" },
  { href: "/pro/patients", label: "Patients" },
  { href: "/pro/messages", label: "Messages" },
  { href: "/pro/profile", label: "Me" },
];

export default async function PhysioLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/auth/login");
  if (user.role !== "PHYSIO") redirect(user.role === "PATIENT" ? "/app" : "/admin");

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <main className="flex-1 pb-20 md:pb-0 md:pt-16">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-surface md:top-0 md:bottom-auto">
        <ul className="flex justify-around md:justify-center md:gap-8">
          {tabs.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                className="flex h-14 items-center px-3 text-sm font-medium text-text-muted hover:text-primary-600 md:h-16"
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}