"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Card } from "@physio/ui";

type Slot = { startsAt: string; durationMinutes: number; mode: "VIDEO" | "HOME" };
type TriageLevel = "GREEN" | "AMBER" | "RED";
type LatestIntake = { id: string; triage: { level: TriageLevel } | null } | null;

function userFriendlyError(code: string | undefined): string {
    switch (code) {
        case "INTAKE_REQUIRED":
            return "You need to complete a health intake before booking. We'll take you there now.";
        case "PROFILE_INCOMPLETE":
            return "Please complete your patient profile before booking.";
        case "SLOT_CONFLICT":
            return "That slot was just taken. Please pick another time.";
        default:
            return "Something went wrong. Please try again.";
    }
}

export default function BookPage() {
    const router = useRouter();
    const params = useParams<{ physioId: string }>();
    const [slots, setSlots] = useState<Slot[]>([]);
    const [intake, setIntake] = useState<LatestIntake | undefined>(undefined);
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load available slots and the patient's latest intake in parallel.
    useEffect(() => {
        Promise.all([
            fetch(`/api/proxy/booking/slots/${params.physioId}`).then((r) => r.json()),
            fetch("/api/proxy/triage/latest").then((r) => (r.ok ? r.json() : null)),
        ])
            .then(([slotsData, intakeData]) => {
                setSlots(slotsData ?? []);
                setIntake(intakeData);
            })
            .catch((e) => setError((e as Error).message));
    }, [params.physioId]);

    // Redirect to intake if there's no intake on record.
    useEffect(() => {
        if (intake === null) {
            router.replace("/app/intake/complaint");
        }
    }, [intake, router]);

    async function onPay() {
        if (!selected || !intake) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/proxy/booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    physioId: params.physioId,
                    intakeId: intake.id,
                    type: "ASSESSMENT",
                    mode: slots.find((s) => s.startsAt === selected)?.mode ?? "VIDEO",
                    startsAt: selected,
                    durationMinutes: 45,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                const code: string | undefined = body.code;
                if (code === "INTAKE_REQUIRED") {
                    router.push("/app/intake/complaint");
                    return;
                }
                throw new Error(userFriendlyError(code));
            }
            const { authorizationUrl } = await res.json();
            window.location.href = authorizationUrl;
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    // Show urgent-care guidance for RED triage.
    if (intake?.triage?.level === "RED") {
        return (
            <div className="mx-auto max-w-2xl p-4">
                <Card padding="md" className="border-danger-500 bg-danger-50">
                    <h1 className="text-xl font-semibold text-danger-800">Urgent care recommended</h1>
                    <p className="mt-2 text-sm text-danger-700">
                        Based on your health assessment, your symptoms need urgent in-person evaluation.
                        Online booking is not available. Please visit your nearest A&amp;E or call your
                        GP immediately.
                    </p>
                    <p className="mt-3 text-sm text-danger-700">
                        If you believe this is an emergency, call <strong>112</strong> now.
                    </p>
                </Card>
                <Button
                    className="mt-4"
                    variant="ghost"
                    onClick={() => router.back()}
                >
                    Go back
                </Button>
            </div>
        );
    }

    // Still loading intake.
    if (intake === undefined) {
        return (
            <div className="mx-auto max-w-2xl p-4">
                <p className="text-sm text-text-muted">Loading…</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl p-4">
            <h1 className="text-2xl font-semibold">Pick a time</h1>

            {intake?.triage?.level === "AMBER" && (
                <p className="mt-2 text-sm text-amber-700 bg-amber-50 rounded p-3">
                    Your health assessment flagged some concerns. A home visit may be recommended.
                    Your physiotherapist will discuss options with you after booking.
                </p>
            )}

            <Card className="mt-6" padding="md">
                {slots.length === 0 && <p className="text-sm text-text-muted">No slots available in the next 14 days.</p>}
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {slots.slice(0, 24).map((s) => {
                        const d = new Date(s.startsAt);
                        const active = selected === s.startsAt;
                        return (
                            <li key={s.startsAt}>
                                <button
                                    type="button"
                                    onClick={() => setSelected(s.startsAt)}
                                    className={`h-12 w-full rounded-md border text-sm font-medium ${active ? "border-primary-500 bg-primary-50 text-primary-700" : "border-border bg-surface"
                                        }`}
                                >
                                    {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
                                    {d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </Card>

            {error && <p className="mt-4 text-sm text-danger-700">{error}</p>}

            <div className="mt-6">
                <Button onClick={onPay} disabled={!selected} loading={loading} fullWidth>
                    Pay &amp; book
                </Button>
            </div>
        </div>
    );
}
