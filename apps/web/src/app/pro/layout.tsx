import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";
import { apiFetch } from "@/lib/api";
import ProShell from "@/components/pro-shell";

const DISCIPLINE_MAP: Record<string, string> = {
    PHYSIOTHERAPY: "Physiotherapist",
    OCCUPATIONAL_THERAPY: "Occupational therapist",
    SPEECH_LANGUAGE_PATHOLOGY: "Speech therapist",
    PROSTHETICS_ORTHOTICS: "Prosthetist / orthotist",
    AUDIOLOGY: "Audiologist",
    CHIROPRACTIC: "Chiropractor",
    DIETETICS: "Dietitian",
    PSYCHOLOGY: "Psychologist",
    SPORTS_MEDICINE: "Sports medicine",
    MASSAGE_THERAPY: "Massage therapist",
};

export default async function ProLayout({ children }: { children: React.ReactNode }) {
    // PATIENT is allowed so new professionals can reach /pro/onboarding before admin verifies them.
    // ProShell's BARE path list skips the sidebar for /pro/onboarding routes.
    const user = await requireSession(["PATIENT", "PHYSIO"]);
    let discipline = "";
    try {
        const pro = await apiFetch<{ discipline: string }>(`/physios/me`);
        discipline = DISCIPLINE_MAP[pro.discipline] ?? pro.discipline;
    } catch { /* not yet profiled */ }
    return (
        <ProShell userName={user.name} discipline={discipline}>
            {children}
        </ProShell>
    );
}
