import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";

export default async function PhysioLayout({ children }: { children: React.ReactNode }) {
    const user = await requireSession(["PHYSIO"]);

    // Admin and physio share the same route group, but we only gate PHYSIO here.
    try {
        const profile = await apiFetch<{ licenceStatus: string }>(`/physios/${user.id}`);
        if (profile.licenceStatus === "VERIFIED") return <>{children}</>;
        if (profile.licenceStatus === "UNVERIFIED") redirect("/pro/onboarding/pending");
        if (profile.licenceStatus === "REJECTED") redirect("/pro/onboarding/pending");
        if (profile.licenceStatus === "EXPIRED") redirect("/pro/onboarding/apply");
    } catch (err) {
        // Physio exists but has no profile yet — apply.
        redirect("/pro/onboarding/apply");
    }

    redirect("/pro/onboarding/pending");
}