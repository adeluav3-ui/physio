"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

const NAV = "#022449";
const GREEN = "#1b7d0e";
const MUTED = "#4f6478";
const BORDER = "#d9e3ec";

export default function DischargePage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const [summary, setSummary] = useState("");
    const [maintenancePlan, setMaintenancePlan] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function discharge() {
        if (summary.trim().length < 20) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(`/api/proxy/programs/${params.id}/discharge`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dischargeSummary: summary.trim(),
                    maintenancePlan: maintenancePlan.trim() || undefined,
                }),
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error((b as { message?: string }).message ?? "Could not discharge patient");
            }
            setDone(true);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    if (done) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f8fb", fontFamily: "'Figtree', system-ui, sans-serif" }}>
                <div style={{ textAlign: "center", maxWidth: 360, padding: 24 }}>
                    <p style={{ fontSize: 18, fontWeight: 700, color: NAV }}>Patient discharged</p>
                    <p style={{ fontSize: 14, color: MUTED, marginTop: 8 }}>The discharge summary has been saved and the patient has been notified.</p>
                    <button
                        onClick={() => router.push("/pro")}
                        style={{ marginTop: 24, minHeight: 44, padding: "0 24px", borderRadius: 10, background: GREEN, color: "#fff", border: 0, fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}
                    >
                        Back to dashboard
                    </button>
                </div>
            </div>
        );
    }

    const canSubmit = summary.trim().length >= 20 && !submitting;

    return (
        <div style={{ minHeight: "100vh", background: "#f4f8fb", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "'Figtree', system-ui, sans-serif" }}>
            <div style={{ width: "100%", maxWidth: 540, background: "#fff", borderRadius: 20, border: `1px solid ${BORDER}`, padding: "32px 28px" }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: NAV, margin: "0 0 6px" }}>Discharge patient</h1>
                <p style={{ fontSize: 14, color: MUTED, margin: "0 0 28px" }}>
                    This will mark the program as complete and notify the patient. This action cannot be undone.
                </p>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                        Discharge summary <span style={{ color: "#b91c1c" }}>*</span>
                    </label>
                    <textarea
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        rows={5}
                        placeholder="Summarise the patient's progress, outcomes achieved, and reason for discharge…"
                        maxLength={4000}
                        style={{ display: "block", width: "100%", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", color: NAV, resize: "vertical", boxSizing: "border-box" }}
                    />
                    <p style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{summary.trim().length}/4000 — min 20 characters</p>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                        Maintenance plan <span style={{ color: MUTED, fontWeight: 400, textTransform: "none" }}>(optional)</span>
                    </label>
                    <textarea
                        value={maintenancePlan}
                        onChange={(e) => setMaintenancePlan(e.target.value)}
                        rows={4}
                        placeholder="Home exercise programme, lifestyle advice, and any red flags to watch for…"
                        maxLength={4000}
                        style={{ display: "block", width: "100%", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", color: NAV, resize: "vertical", boxSizing: "border-box" }}
                    />
                </div>

                {error && <p style={{ fontSize: 13, color: "#b91c1c", marginBottom: 12 }}>{error}</p>}

                <button
                    onClick={discharge}
                    disabled={!canSubmit}
                    style={{
                        display: "block",
                        width: "100%",
                        minHeight: 48,
                        borderRadius: 12,
                        background: canSubmit ? GREEN : "#9db8a0",
                        color: "#fff",
                        border: 0,
                        fontWeight: 600,
                        fontSize: 16,
                        cursor: canSubmit ? "pointer" : "not-allowed",
                        fontFamily: "inherit",
                    }}
                >
                    {submitting ? "Discharging…" : "Confirm discharge"}
                </button>

                <button
                    onClick={() => router.back()}
                    style={{ display: "block", width: "100%", marginTop: 10, minHeight: 44, borderRadius: 12, background: "none", color: MUTED, border: `1px solid ${BORDER}`, fontWeight: 500, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
