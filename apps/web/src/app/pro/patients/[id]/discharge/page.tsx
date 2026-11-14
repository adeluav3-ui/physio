"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const NAV = "#022449";
const GREEN = "#1b7d0e";
const MUTED = "#4f6478";
const BORDER = "#d9e3ec";
const GROUND = "#f4f8fb";

export default function DischargePage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const [programId, setProgramId] = useState("");
    const [dischargeSummary, setDischargeSummary] = useState("");
    const [maintenancePlan, setMaintenancePlan] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    async function submit() {
        if (!programId.trim() || !dischargeSummary.trim()) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(`/api/programs/${programId}/discharge`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    dischargeSummary: dischargeSummary.trim(),
                    ...(maintenancePlan.trim() && { maintenancePlan: maintenancePlan.trim() }),
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((body as { message?: string }).message ?? "Discharge failed");
            }
            setDone(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : "An error occurred.");
        } finally {
            setSubmitting(false);
        }
    }

    if (done) {
        return (
            <div style={{ maxWidth: 560, margin: "60px auto", padding: "32px", textAlign: "center", background: "#fff", borderRadius: 10, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <h2 style={{ color: GREEN, marginBottom: 8 }}>Discharge complete</h2>
                <p style={{ color: MUTED, marginBottom: 24 }}>The patient has been notified with a link to their discharge summary.</p>
                <Link
                    href={`/pro/patients/${params.id}`}
                    style={{ display: "inline-block", background: NAV, color: "#fff", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}
                >
                    Back to patient
                </Link>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
            <div style={{ marginBottom: 20 }}>
                <Link href={`/pro/patients/${params.id}`} style={{ color: NAV, textDecoration: "none", fontSize: 14 }}>← Back to patient</Link>
            </div>

            <h1 style={{ color: NAV, fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Discharge patient</h1>
            <p style={{ color: MUTED, fontSize: 14, marginBottom: 24 }}>Completing discharge will close the active programme and notify the patient.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20, background: "#fff", padding: 24, borderRadius: 10, border: `1px solid ${BORDER}` }}>
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAV, marginBottom: 6 }}>Programme ID</label>
                    <input
                        value={programId}
                        onChange={(e) => setProgramId(e.target.value)}
                        placeholder="Paste the programme ID"
                        style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "8px 12px", fontSize: 14, boxSizing: "border-box" }}
                    />
                    <p style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>Find the programme ID on the patient's programme tab.</p>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAV, marginBottom: 6 }}>Discharge summary <span style={{ color: "#b91c1c" }}>*</span></label>
                    <textarea
                        value={dischargeSummary}
                        onChange={(e) => setDischargeSummary(e.target.value)}
                        placeholder="Summarise the patient's progress, outcomes and reason for discharge."
                        rows={6}
                        style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "8px 12px", fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAV, marginBottom: 6 }}>Maintenance plan <span style={{ color: MUTED, fontWeight: 400 }}>(optional)</span></label>
                    <textarea
                        value={maintenancePlan}
                        onChange={(e) => setMaintenancePlan(e.target.value)}
                        placeholder="Ongoing exercises or lifestyle advice to help the patient maintain their progress."
                        rows={5}
                        style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "8px 12px", fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                    />
                </div>

                {error && <p style={{ color: "#b91c1c", fontSize: 14, margin: 0 }}>{error}</p>}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                    <Link
                        href={`/pro/patients/${params.id}`}
                        style={{ padding: "10px 20px", border: `1px solid ${BORDER}`, borderRadius: 8, textDecoration: "none", color: MUTED, fontSize: 14 }}
                    >
                        Cancel
                    </Link>
                    <button
                        onClick={() => void submit()}
                        disabled={submitting || !programId.trim() || !dischargeSummary.trim()}
                        style={{
                            padding: "10px 24px",
                            background: NAV,
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: "pointer",
                            opacity: submitting || !programId.trim() || !dischargeSummary.trim() ? 0.5 : 1,
                        }}
                    >
                        {submitting ? "Discharging…" : "Discharge patient"}
                    </button>
                </div>
            </div>
        </div>
    );
}
