"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input } from "@physio/ui";
import { physioApplySchema, DISCIPLINE_LABELS } from "@physio/shared";

type Discipline = keyof typeof DISCIPLINE_LABELS;

const DISCIPLINES = Object.entries(DISCIPLINE_LABELS) as [Discipline, string][];

export default function ProfessionalApplyPage() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [discipline, setDiscipline] = useState<Discipline>("PHYSIOTHERAPY");
    const [licenceNo, setLicenceNo] = useState("");
    const [specialties, setSpecialties] = useState("");
    const [bio, setBio] = useState("");
    const [rate, setRate] = useState("");
    const [serviceArea, setServiceArea] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch("/api/proxy/auth/me")
            .then((r) => {
                if (!r.ok) throw new Error("Not signed in");
                return r.json();
            })
            .then((user) => {
                if (user.role !== "PHYSIO" && user.role !== "PATIENT") throw new Error("Not signed in");
                setChecking(false);
            })
            .catch(() => {
                window.location.href = "/auth/login?next=/pro/onboarding/apply";
            });
    }, []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const parsed = physioApplySchema.safeParse({
            discipline,
            licenceNo,
            specialties: specialties.split(",").map((s) => s.trim()).filter(Boolean),
            bio,
            rate: Math.round(Number(rate) * 100),
            serviceArea,
        });
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Please check your inputs");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/proxy/physios/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed.data),
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error(b.message ?? "Application failed");
            }
            router.push("/pro/onboarding/pending");
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    if (checking) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-sm text-text-muted">Loading…</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl p-4 pb-16">
            <h1 className="text-2xl font-semibold">Professional application</h1>
            <p className="mt-1 text-sm text-text-muted">
                We verify every licence with the relevant regulatory body before your profile appears to patients.
            </p>

            <Card className="mt-6">
                <form onSubmit={onSubmit} className="flex flex-col gap-5">

                    <Field label="Discipline" required>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {DISCIPLINES.map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setDiscipline(key)}
                                    className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                                        discipline === key
                                            ? "border-primary-500 bg-primary-50 text-primary-700"
                                            : "border-border bg-surface text-text hover:border-primary-300"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </Field>

                    <Input
                        label="Licence / registration number"
                        value={licenceNo}
                        onChange={(e) => setLicenceNo(e.target.value)}
                        hint="As it appears on your regulatory board certificate"
                        required
                    />

                    <Input
                        label="Specialties"
                        value={specialties}
                        onChange={(e) => setSpecialties(e.target.value)}
                        hint="Comma-separated, e.g. Paediatrics, Neuro, Post-op"
                        required
                    />

                    <Field label="Short bio" required>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="h-32 w-full rounded-md border border-border p-3 text-sm focus:border-primary-400 focus:outline-none"
                            placeholder="Your experience and approach to care (min. 50 characters)"
                            required
                        />
                    </Field>

                    <Input
                        label="Session rate (NGN)"
                        type="number"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        hint="What patients pay per session"
                        required
                    />

                    <Input
                        label="Service area"
                        value={serviceArea}
                        onChange={(e) => setServiceArea(e.target.value)}
                        hint="City or region where you see patients"
                        required
                    />

                    {error && <p className="text-sm text-danger-700">{error}</p>}

                    <Button type="submit" loading={loading} fullWidth>
                        Submit for verification
                    </Button>
                </form>
            </Card>
        </div>
    );
}
