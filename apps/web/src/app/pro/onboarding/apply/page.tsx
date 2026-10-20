"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@physio/ui";
import { physioApplySchema } from "@physio/shared";

export default function PhysioApplyPage() {
    const router = useRouter();
    const [licenceNo, setLicenceNo] = useState("");
    const [specialties, setSpecialties] = useState("");
    const [bio, setBio] = useState("");
    const [rate, setRate] = useState("");
    const [serviceArea, setServiceArea] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const parsed = physioApplySchema.safeParse({
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

    return (
        <div className="mx-auto max-w-2xl p-4">
            <h1 className="text-2xl font-semibold">Physio application</h1>
            <p className="mt-1 text-sm text-text-muted">
                We verify every licence with the Medical Rehabilitation Therapists Board of Nigeria
                before your profile appears to patients.
            </p>

            <Card className="mt-6">
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                    <Input
                        label="Licence number"
                        value={licenceNo}
                        onChange={(e) => setLicenceNo(e.target.value)}
                        required
                    />
                    <Input
                        label="Specialties"
                        value={specialties}
                        onChange={(e) => setSpecialties(e.target.value)}
                        hint="Comma-separated, e.g. Sports, Post-op, Neuro"
                        required
                    />
                    <div>
                        <label className="text-sm font-medium text-text">Short bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="mt-1 h-32 w-full rounded-md border border-border p-3 text-sm"
                            placeholder="Your experience and approach to care"
                            required
                        />
                    </div>
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
                        hint="City or region for home visits"
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