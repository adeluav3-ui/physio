import { requireAccess } from "@/lib/access";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
    await requireAccess();
    return <>{children}</>;
}
