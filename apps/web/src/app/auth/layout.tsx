import { requireAccess } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
    await requireAccess();
    return <>{children}</>;
}
