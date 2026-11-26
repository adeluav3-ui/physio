"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type FormType = "PATIENT_SESSION" | "SPECIALIST_SESSION";

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
    return (
        <div>
            <div style={{ font: "500 13px 'Figtree',sans-serif", marginBottom: "6px" }}>{label}</div>
            <div style={{ display: "flex", gap: "6px" }}>
                {[1, 2, 3, 4, 5].map(n => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n)}
                        style={{
                            fontSize: "24px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: n <= value ? "#f59e0b" : "#d1d5db",
                            padding: "2px",
                        }}
                        aria-label={`${n} star${n !== 1 ? "s" : ""}`}
                    >
                        ★
                    </button>
                ))}
            </div>
        </div>
    );
}

function ScoreSlider({ value, onChange, label, hint }: { value: number; onChange: (v: number) => void; label: string; hint?: string }) {
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ font: "500 13px 'Figtree',sans-serif" }}>{label}</span>
                <span style={{ font: "700 13px 'Figtree',sans-serif", color: "#1b7d0e" }}>{value}/10</span>
            </div>
            {hint && <div className="muted" style={{ font: "400 12px 'Figtree',sans-serif", marginBottom: "4px" }}>{hint}</div>}
            <input
                type="range"
                min={1}
                max={10}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#1fa8e0" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", font: "400 11px 'Figtree',sans-serif", color: "#9ca3af" }}>
                <span>1 (worst)</span><span>10 (best)</span>
            </div>
        </div>
    );
}

export default function FeedbackPage() {
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const router = useRouter();
    const role = searchParams.get("role") ?? "patient";

    const formType: FormType = role === "physio" ? "SPECIALIST_SESSION" : "PATIENT_SESSION";

    const [painScore, setPainScore] = useState(5);
    const [functionScore, setFunctionScore] = useState(5);
    const [overallRating, setOverallRating] = useState(0);
    const [communicationRating, setCommunicationRating] = useState(0);
    const [whatWentWell, setWhatWentWell] = useState("");
    const [whatCouldImprove, setWhatCouldImprove] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function submit() {
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch("/api/proxy/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    formType,
                    appointmentId: params.id,
                    painScore: formType === "PATIENT_SESSION" ? painScore : undefined,
                    functionScore: formType === "PATIENT_SESSION" ? functionScore : undefined,
                    overallRating: overallRating || undefined,
                    communicationRating: communicationRating || undefined,
                    whatWentWell: whatWentWell.trim() || undefined,
                    whatCouldImprove: whatCouldImprove.trim() || undefined,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data as { message?: string }).message ?? `HTTP ${res.status}`);
            }
            router.push("/app");
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div style={{ maxWidth: "480px", margin: "0 auto", padding: "32px 20px", fontFamily: "'Figtree',system-ui,sans-serif", color: "#022449" }}>
            <h1 style={{ font: "700 24px 'Figtree',sans-serif", margin: "0 0 6px" }}>How did your session go?</h1>
            <p className="muted" style={{ font: "400 14px 'Figtree',sans-serif", margin: "0 0 24px" }}>
                Your feedback helps us improve care. It takes about a minute.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Outcome measures — patient only */}
                {formType === "PATIENT_SESSION" && (
                    <>
                        <ScoreSlider
                            value={painScore}
                            onChange={setPainScore}
                            label="How would you rate your pain today?"
                            hint="1 = severe pain, 10 = no pain at all"
                        />
                        <ScoreSlider
                            value={functionScore}
                            onChange={setFunctionScore}
                            label="How well can you do your daily activities?"
                            hint="1 = very limited, 10 = fully normal"
                        />
                    </>
                )}

                <StarRating value={overallRating} onChange={setOverallRating} label="Overall session rating" />
                <StarRating value={communicationRating} onChange={setCommunicationRating} label="Communication with your specialist" />

                <div>
                    <label style={{ display: "block", font: "500 13px 'Figtree',sans-serif", marginBottom: "6px" }}>
                        What went well? <span className="muted">(optional)</span>
                    </label>
                    <textarea
                        value={whatWentWell}
                        onChange={e => setWhatWentWell(e.target.value)}
                        placeholder="e.g. Clear explanations, felt heard…"
                        style={{ width: "100%", minHeight: "80px", padding: "10px 12px", border: "1px solid #c8d8e6", borderRadius: "10px", font: "400 14px 'Figtree',sans-serif", resize: "vertical", boxSizing: "border-box" }}
                    />
                </div>

                <div>
                    <label style={{ display: "block", font: "500 13px 'Figtree',sans-serif", marginBottom: "6px" }}>
                        What could be improved? <span className="muted">(optional)</span>
                    </label>
                    <textarea
                        value={whatCouldImprove}
                        onChange={e => setWhatCouldImprove(e.target.value)}
                        placeholder="e.g. Would have liked more exercises…"
                        style={{ width: "100%", minHeight: "80px", padding: "10px 12px", border: "1px solid #c8d8e6", borderRadius: "10px", font: "400 14px 'Figtree',sans-serif", resize: "vertical", boxSizing: "border-box" }}
                    />
                </div>

                {error && (
                    <div style={{ padding: "10px 14px", background: "#fef2f2", borderRadius: "8px", color: "#b91c1c", font: "500 14px 'Figtree',sans-serif" }}>
                        {error}
                    </div>
                )}

                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        type="button"
                        onClick={() => void submit()}
                        disabled={submitting}
                        className="btn"
                        style={{ flex: 1 }}
                    >
                        {submitting ? "Submitting…" : "Submit feedback"}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push("/app")}
                        className="btn btn2"
                        style={{ flex: 1 }}
                    >
                        Skip
                    </button>
                </div>
            </div>
        </div>
    );
}
