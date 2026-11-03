"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

export default function PatientProfilePage() {
    const router = useRouter();
    const [dob, setDob] = useState("");
    const [sex, setSex] = useState("");
    const [location, setLocation] = useState("");
    const [emergencyContact, setEmergencyContact] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetch("/api/proxy/patients/me")
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data) {
                    setDob(data.dob ? data.dob.slice(0, 10) : "");
                    setSex(data.sex ?? "");
                    setLocation(data.location ?? "");
                    setEmergencyContact(data.emergencyContact ?? "");
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSaving(true);
        setSaved(false);
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
            setSaved(true);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return (
        <div style={{ padding: "32px 20px", textAlign: "center", font: "400 14px 'Figtree',sans-serif", color: "#4f6478" }}>Loading…</div>
    );

    return (
        <div style={{ padding: "20px" }}>
            <h1 style={{ font: "700 22px 'Figtree',sans-serif", marginBottom: "16px" }}>Your details</h1>

            <div className="card">
                <form onSubmit={onSubmit} style={{ display: "grid", gap: "14px" }}>
                    <div>
                        <label className="flabel" htmlFor="p-dob">Date of birth</label>
                        <input className="in" id="p-dob" type="date" value={dob} onChange={e => setDob(e.target.value)} required />
                    </div>
                    <div>
                        <label className="flabel" htmlFor="p-sex">Sex</label>
                        <select className="in" id="p-sex" value={sex} onChange={e => setSex(e.target.value)} required style={{ cursor: "pointer" }}>
                            <option value="">Select…</option>
                            <option value="FEMALE">Female</option>
                            <option value="MALE">Male</option>
                            <option value="OTHER">Other</option>
                            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                        </select>
                    </div>
                    <div>
                        <label className="flabel" htmlFor="p-loc">Location (city / region)</label>
                        <input className="in" id="p-loc" value={location} onChange={e => setLocation(e.target.value)} required />
                    </div>
                    <div>
                        <label className="flabel" htmlFor="p-ec">Emergency contact</label>
                        <input className="in" id="p-ec" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} placeholder="Name and phone number" required />
                    </div>

                    {error && <p style={{ color: "#8f1d1d", font: "400 14px 'Figtree',sans-serif", margin: 0 }}>{error}</p>}
                    {saved && <p style={{ color: "#1d5c34", font: "400 14px 'Figtree',sans-serif", margin: 0 }}>Saved.</p>}

                    <button type="submit" className="btn" disabled={saving} style={{ width: "100%", opacity: saving ? 0.7 : 1 }}>
                        {saving ? "Saving…" : "Save details"}
                    </button>
                </form>
            </div>

            <div className="card" style={{ marginTop: "14px" }}>
                <div style={{ font: "600 15px 'Figtree',sans-serif", marginBottom: "12px" }}>Account</div>
                <SignOutButton className="btn btn2" style={{ width: "100%", minHeight: "44px" }} />
            </div>
        </div>
    );
}
