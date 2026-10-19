"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Input } from "@physio/ui";

export default function PhysioNotePage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const [subjective, setSubjective] = useState("");
    const [objective, setObjective] = useState("");
    const [assessment, setAssessment] = useState("");
    const [plan, setPlan] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSave(andAssignProgram: boolean) {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/proxy/sessions/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appointmentId: params.id,
                    subjective,
                    objective,
                    assessment,
                    plan,
                    outcomeMeasures: {},
                }),
            });
            if (!res.ok) {
                const b = await res.json();
                throw new Error(b.message ?? "Failed to save note");
            }
            if (andAssignProgram) {
                router.push(`/pro/programs/new?patientAppointment=${params.id}`);
            } else {
                router.push("/pro");
            }
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto max-w-2xl p-4">
            <h1 className="text-2xl font-semibold">Session note</h1>
            <p className="mt-1 text-sm text-text-muted">SOAP format. You can edit this later from the patient record.</p>

            <Card className="mt-6 flex flex-col gap-4">
                <div>
                    <label className="text-sm font-medium">Subjective</label>
                    <textarea
                        value={subjective}
                        onChange={(e) => setSubjective(e.target.value)}
                        className="mt-1 h-24 w-full rounded-md border border-border p-3 text-sm"
                        placeholder="Patient's report, symptoms, history"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Objective</label>
                    <textarea
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        className="mt-1 h-24 w-full rounded-md border border-border p-3 text-sm"
                        placeholder="Observed movement, tests, measurements"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Assessment</label>
                    <textarea
                        value={assessment}
                        onChange={(e) => setAssessment(e.target.value)}
                        className="mt-1 h-24 w-full rounded-md border border-border p-3 text-sm"
                        placeholder="Diagnosis and clinical reasoning"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Plan</label>
                    <textarea
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        className="mt-1 h-24 w-full rounded-md border border-border p-3 text-sm"
                        placeholder="Treatment plan, next steps, education"
                    />
                </div>

                {error && <p className="text-sm text-danger-700">{error}</p>}

                <div className="flex flex-col gap-2 sm:flex-row">
                    <Button onClick={() => onSave(true)} loading={saving} fullWidth>
                        Save & assign program
                    </Button>
                    <Button onClick={() => onSave(false)} variant="secondary" loading={saving} fullWidth>
                        Save only
                    </Button>
                </div>
            </Card>
        </div>
    );
}