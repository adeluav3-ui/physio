"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TriageResultCard } from "@physio/ui";

type TriageLevel = "GREEN" | "AMBER" | "RED";

export default function TriageResultPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get("id");

    const [level, setLevel] = useState<TriageLevel | null>(null);
    const [reasons, setReasons] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) { setError("No result found."); return; }
        fetch(`/api/proxy/triage/${id}`)
            .then(async (r) => {
                if (!r.ok) throw new Error("Could not load result.");
                return r.json() as Promise<{ triage: { level: TriageLevel; reasons: string[] } }>;
            })
            .then((d) => { setLevel(d.triage.level); setReasons(d.triage.reasons); })
            .catch(() => setError("Could not load your result. Please try again."));
    }, [id]);

    if (error) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center p-4 text-center text-text-muted">
                {error}
            </div>
        );
    }

    if (!level) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center p-4 text-center text-text-muted">
                Loading your result…
            </div>
        );
    }

    return (
        <TriageResultCard
            level={level}
            reasons={reasons}
            {...(level !== "RED" && {
                primaryAction: {
                    label: "Find a professional",
                    onClick: () => router.push("/app/physios"),
                },
            })}
            secondaryAction={{
                label: level === "RED" ? "I understand" : "Back to home",
                onClick: () => router.push("/app"),
            }}
            {...(level === "RED"
                ? {
                    emergencyContacts: [
                        { label: "Emergency", phone: "112" },
                        { label: "Nearest hospital", phone: "+2348000000000" },
                    ],
                }
                : {})}
        />
    );
}
