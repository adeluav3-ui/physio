"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TriageResultCard } from "@physio/ui";

type TriageLevel = "GREEN" | "FLAG" | "IN_PERSON_REQUIRED";
type Specialist = { physio: { userId: string; user: { name: string } } };

export default function TriageResultPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get("id");

    const [level, setLevel] = useState<TriageLevel | null>(null);
    const [reasons, setReasons] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [specialists, setSpecialists] = useState<Specialist[]>([]);

    useEffect(() => {
        if (!id) { setError("No result found."); return; }
        Promise.all([
            fetch(`/api/proxy/triage/${id}`)
                .then(async (r) => {
                    if (!r.ok) throw new Error("Could not load result.");
                    return r.json() as Promise<{ triage: { level: TriageLevel; reasons: string[] } }>;
                }),
            fetch("/api/proxy/booking/my-specialists")
                .then((r) => r.ok ? r.json() as Promise<Specialist[]> : [])
                .catch(() => [] as Specialist[]),
        ])
            .then(([d, specs]) => {
                setLevel(d.triage.level);
                setReasons(d.triage.reasons);
                setSpecialists(specs);
            })
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

    const existingSpecialist = specialists[0] ?? null;

    const primaryAction = level !== "IN_PERSON_REQUIRED" ? {
        label: existingSpecialist
            ? `Book with ${existingSpecialist.physio.user.name.split(" ")[0]}`
            : "Find a professional",
        onClick: () => router.push(
            existingSpecialist
                ? `/app/book/${existingSpecialist.physio.userId}/followup`
                : "/app/physios"
        ),
    } : undefined;

    const secondaryAction = {
        label: level === "IN_PERSON_REQUIRED"
            ? "I understand"
            : existingSpecialist
                ? "Choose a different specialist"
                : "Back to home",
        onClick: () => router.push(
            level === "IN_PERSON_REQUIRED" || !existingSpecialist ? "/app" : "/app/physios"
        ),
    };

    return (
        <TriageResultCard
            level={level}
            reasons={reasons}
            {...(primaryAction ? { primaryAction } : {})}
            secondaryAction={secondaryAction}
            {...(level === "IN_PERSON_REQUIRED"
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
