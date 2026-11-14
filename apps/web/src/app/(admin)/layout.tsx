import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const user = await getSession();
    if (!user) redirect("/auth/login");
    if (user.role !== "ADMIN") redirect(user.role === "PATIENT" ? "/app" : "/pro");

    return <AdminShell userName={user.name}>{children}</AdminShell>;
}
