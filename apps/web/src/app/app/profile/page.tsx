"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@physio/ui";

export default function PatientProfilePage() {
    const router = useRouter();
    const [dob, setDob] = useState("");
    const [sex, setSex] = useState("");
    const [location, setLocation] = useState("");
    const [emergencyContact, setEmergencyContact] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/proxy/patients/me")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data) {
                    setDob(data.dob ? data.dob.slice(0, 10) : "");
                    setSex(data.sex ?? "");
                    setLocation(data.location ?? "");
                    setEmergencyContact(data.emergencyContact ?? "");
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            const res = await fetch("/api/proxy/patients/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dob, sex, location, emergencyContact }),
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error(b.message ?? "Failed to save");
            }
            router.push("/app");
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="p-8 text-center text-sm text-text-muted">Loading…</div>;

    return (
        <div className="mx-auto max-w-md p-4">
            <Card className="p-6">
                <h1 className="text-2xl font-semibold">Your details</h1>
                <p className="mt-1 text-sm text-text-muted">
                    Required before your first booking. Used only for your care.
                </p>

                <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
                    <Input label="Date of birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                    <div>
                        <label className="text-sm font-medium">Sex</label>
                        <select
                            value={sex}
                            onChange={(e) => setSex(e.target.value)}
                            className="mt-1 h-12 w-full rounded-md border border-border bg-surface px-3 text-base"
                            required
                        >
                            <option value="">Select…</option>
                            <option value="FEMALE">Female</option>
                            <option value="MALE">Male</option>
                            <option value="OTHER">Other</option>
                            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                        </select>
                    </div>
                    <Input label="Location (city / region)" value={location} onChange={(e) => setLocation(e.target.value)} required />
                    <Input
                        label="Emergency contact"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        hint="Name and phone number"
                        required
                    />
                    {error && <p className="text-sm text-danger-700">{error}</p>}
                    <Button type="submit" loading={saving} fullWidth>Save details</Button>
                </form>
            </Card>
        </div>
    );
}