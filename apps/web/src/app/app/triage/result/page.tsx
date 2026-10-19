import { TriageResultCard } from "@physio/ui";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { requireSession } from "@/lib/session";

export default async function TriageResultPage({
    searchParams,
}: {
    searchParams: Promise<{ id?: string }>;
}) {
    const { id } = await searchParams;
    await requireSession(["PATIENT"]);

    if (!id) {
        return <div className="p-8 text-center text-text-muted">No triage result found.</div>;
    }

    const data = await apiFetch<{
        triage: { level: "GREEN" | "AMBER" | "RED"; reasons: string[] };
    }>(`/triage/${id}`);

    const { level, reasons } = data.triage;

    return (
        <TriageResultCard
            level={level}
            reasons={reasons}
            primaryAction={
                level === "RED"
                    ? undefined
                    : {
                        label: "Find a physio",
                        onClick: () => {
                            window.location.href = "/app/physios";
                        },
                    }
            }
            secondaryAction={{
                label: level === "RED" ? "I understand" : "Back to home",
                onClick: () => {
                    window.location.href = "/app";
                },
            }}
            emergencyContacts={
                level === "RED"
                    ? [
                        { label: "Emergency", phone: "112" },
                        { label: "Nearest hospital", phone: "+2348000000000" },
                    ]
                    : undefined
            }
        />
    );
}