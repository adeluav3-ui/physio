"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { useIntake } from "../intake-store";

const STEPS = [
    { id: "complaint",  label: "Concern" },
    { id: "bodyRegion", label: "Body area" },
    { id: "onset",      label: "Timeline" },
    { id: "painScore",  label: "Pain" },
    { id: "history",    label: "History" },
    { id: "medications",label: "Medications" },
    { id: "redFlags",   label: "Safety" },
    { id: "review",     label: "Review" },
];

const BODY_REGIONS: { key: string; label: string }[] = [
    { key: "NECK",        label: "Neck" },
    { key: "SHOULDER",    label: "Shoulder" },
    { key: "ELBOW",       label: "Elbow" },
    { key: "WRIST_HAND",  label: "Wrist / Hand" },
    { key: "UPPER_BACK",  label: "Upper Back" },
    { key: "LOWER_BACK",  label: "Lower Back" },
    { key: "HIP",         label: "Hip" },
    { key: "KNEE",        label: "Knee" },
    { key: "ANKLE_FOOT",  label: "Ankle / Foot" },
    { key: "OTHER",       label: "Other area" },
];

const RED_FLAG_QUESTIONS = [
    { id: "major_trauma",           label: "Have you had a major injury, fall, or suspected broken bone in the last 2 weeks?" },
    { id: "neuro_progressive_weakness", label: "Are you noticing weakness in your arms or legs that is getting worse?" },
    { id: "neuro_bladder_bowel",    label: "Have you lost control of your bladder or bowels unexpectedly?" },
    { id: "neuro_saddle_numbness",  label: "Do you have numbness or tingling in the area where you would sit on a saddle?" },
    { id: "cardioresp",             label: "Are you having chest pain, difficulty breathing, or signs of a blood clot?" },
    { id: "systemic",               label: "Have you had unexplained weight loss, fever, or pain that wakes you at night?" },
    { id: "post_op_complication",   label: "Do you have wound infection, unusual swelling, or complications after surgery?" },
    { id: "severe_worsening",       label: "Is your pain severe and getting rapidly worse by the hour?" },
    { id: "post_op_planned",        label: "Have you had an operation in the last 6 weeks?" },
    { id: "mobility_limited",       label: "Is your ability to move significantly limited compared to normal?" },
];

type IntakeDraft = {
    complaint: string;
    bodyRegion: string;
    onset: string;
    painScore: number;
    history: string;
    medications: string;
    redFlags: Record<string, boolean>;
};

function validateStep(stepId: string, draft: IntakeDraft): string | null {
    if (stepId === "complaint" && !draft.complaint.trim()) {
        return "Please describe your main concern before continuing.";
    }
    if (stepId === "bodyRegion" && !draft.bodyRegion) {
        return "Please select the body area that is affected.";
    }
    if (stepId === "onset" && !draft.onset.trim()) {
        return "Please tell us when this started.";
    }
    if (stepId === "redFlags") {
        const answered = Object.keys(draft.redFlags).length;
        if (answered < RED_FLAG_QUESTIONS.length) {
            return `Please answer all ${RED_FLAG_QUESTIONS.length} safety questions (${answered} of ${RED_FLAG_QUESTIONS.length} done).`;
        }
    }
    return null;
}

function painLabel(score: number) {
    if (score === 0) return { text: "No pain", color: "#1b7d0e" };
    if (score <= 2) return { text: "Very mild", color: "#2d8f10" };
    if (score <= 4) return { text: "Mild", color: "#7a8f10" };
    if (score <= 6) return { text: "Moderate", color: "#c97a00" };
    if (score <= 8) return { text: "Severe", color: "#c94f00" };
    return { text: "Worst possible", color: "#c90000" };
}

export default function IntakeStepPage() {
    const router = useRouter();
    const params = useParams<{ step: string }>();
    const stepId = params.step;

    const { draft, update, reset } = useIntake();
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    const currentIndex = STEPS.findIndex((s) => s.id === stepId);
    const nextStep = STEPS[currentIndex + 1];
    const prevStep = STEPS[currentIndex - 1];

    function goNext() {
        const err = validateStep(stepId, draft);
        if (err) { setValidationError(err); return; }
        setValidationError(null);
        if (nextStep) router.push(`/app/intake/${nextStep.id}`);
    }

    async function onSubmit() {
        setSubmitting(true);
        setSubmitError(null);
        try {
            const res = await fetch("/api/proxy/triage/intake", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    complaint: draft.complaint,
                    bodyRegion: draft.bodyRegion,
                    onset: draft.onset,
                    painScore: draft.painScore,
                    history: draft.history || undefined,
                    medications: draft.medications || undefined,
                    redFlagAnswers: Object.entries(draft.redFlags).map(([questionId, answer]) => ({
                        questionId,
                        answer,
                    })),
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(
                    (body as { message?: string }).message ??
                    "Something went wrong. Please try again."
                );
            }
            const data = (await res.json()) as { intakeId: string; triage: { id: string } };
            reset();
            router.push(`/app/triage/result?id=${data.intakeId}`);
        } catch (err) {
            setSubmitError((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    const { color: painColor, text: painText } = painLabel(draft.painScore);

    return (
        <div style={{ minHeight: "100dvh", background: "#f4f8fb", fontFamily: "'Figtree',system-ui,sans-serif" }}>
            {/* Progress bar */}
            <div style={{ background: "#fff", borderBottom: "1px solid #d9e3ec", padding: "16px 20px" }}>
                <div style={{ maxWidth: "520px", margin: "0 auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span style={{ font: "600 13px 'Figtree',sans-serif", color: "#022449" }}>
                            Step {currentIndex + 1} of {STEPS.length}
                        </span>
                        <span style={{ font: "400 13px 'Figtree',sans-serif", color: "#4f6478" }}>
                            {STEPS[currentIndex]?.label}
                        </span>
                    </div>
                    <div style={{ height: "4px", background: "#d9e3ec", borderRadius: "2px" }}>
                        <div
                            style={{
                                height: "100%",
                                borderRadius: "2px",
                                background: "#1b7d0e",
                                width: `${((currentIndex + 1) / STEPS.length) * 100}%`,
                                transition: "width 0.3s ease",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: "520px", margin: "0 auto", padding: "32px 20px 120px" }}>

                {/* ── Complaint ─────────────────────────────────────────── */}
                {stepId === "complaint" && (
                    <div>
                        <h1 style={{ font: "700 24px/1.2 'Figtree',sans-serif", color: "#022449", marginBottom: "8px" }}>
                            What is bothering you?
                        </h1>
                        <p style={{ font: "400 15px/1.55 'Figtree',sans-serif", color: "#4f6478", marginBottom: "24px" }}>
                            Describe your main concern in your own words. There are no wrong answers.
                        </p>
                        <textarea
                            value={draft.complaint}
                            onChange={(e) => { update({ complaint: e.target.value }); setValidationError(null); }}
                            placeholder="e.g. My right knee hurts when I climb stairs, especially after sitting for a long time."
                            rows={5}
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: "12px",
                                border: validationError ? "2px solid #c90000" : "1.5px solid #c8d8e8",
                                font: "400 16px/1.5 'Figtree',sans-serif",
                                color: "#022449",
                                background: "#fff",
                                resize: "none",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                            onFocus={(e) => (e.target.style.borderColor = "#1b7d0e")}
                            onBlur={(e) => (e.target.style.borderColor = validationError ? "#c90000" : "#c8d8e8")}
                        />
                    </div>
                )}

                {/* ── Body region ───────────────────────────────────────── */}
                {stepId === "bodyRegion" && (
                    <div>
                        <h1 style={{ font: "700 24px/1.2 'Figtree',sans-serif", color: "#022449", marginBottom: "8px" }}>
                            Which part of your body is affected?
                        </h1>
                        <p style={{ font: "400 15px/1.55 'Figtree',sans-serif", color: "#4f6478", marginBottom: "24px" }}>
                            Tap the area that is bothering you most.
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            {BODY_REGIONS.map((r) => {
                                const selected = draft.bodyRegion === r.key;
                                return (
                                    <button
                                        key={r.key}
                                        type="button"
                                        onClick={() => { update({ bodyRegion: r.key }); setValidationError(null); }}
                                        style={{
                                            padding: "16px 12px",
                                            borderRadius: "12px",
                                            border: selected ? "2.5px solid #1b7d0e" : "1.5px solid #c8d8e8",
                                            background: selected ? "#e8f7e5" : "#fff",
                                            color: selected ? "#1b7d0e" : "#022449",
                                            font: `${selected ? "700" : "500"} 15px 'Figtree',sans-serif`,
                                            cursor: "pointer",
                                            textAlign: "center",
                                            transition: "all 0.15s",
                                            WebkitTapHighlightColor: "transparent",
                                            minHeight: "56px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: selected ? "0 0 0 3px rgba(27,125,14,0.15)" : "none",
                                        }}
                                    >
                                        {r.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Onset ─────────────────────────────────────────────── */}
                {stepId === "onset" && (
                    <div>
                        <h1 style={{ font: "700 24px/1.2 'Figtree',sans-serif", color: "#022449", marginBottom: "8px" }}>
                            When did this start?
                        </h1>
                        <p style={{ font: "400 15px/1.55 'Figtree',sans-serif", color: "#4f6478", marginBottom: "24px" }}>
                            Roughly how long ago did you first notice this problem?
                        </p>
                        <input
                            type="text"
                            value={draft.onset}
                            onChange={(e) => { update({ onset: e.target.value }); setValidationError(null); }}
                            placeholder="e.g. About 3 weeks ago after a football game"
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: "12px",
                                border: validationError ? "2px solid #c90000" : "1.5px solid #c8d8e8",
                                font: "400 16px/1.5 'Figtree',sans-serif",
                                color: "#022449",
                                background: "#fff",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                            onFocus={(e) => (e.target.style.borderColor = "#1b7d0e")}
                            onBlur={(e) => (e.target.style.borderColor = validationError ? "#c90000" : "#c8d8e8")}
                        />
                    </div>
                )}

                {/* ── Pain score ────────────────────────────────────────── */}
                {stepId === "painScore" && (
                    <div>
                        <h1 style={{ font: "700 24px/1.2 'Figtree',sans-serif", color: "#022449", marginBottom: "8px" }}>
                            How much pain are you in right now?
                        </h1>
                        <p style={{ font: "400 15px/1.55 'Figtree',sans-serif", color: "#4f6478", marginBottom: "32px" }}>
                            0 means no pain at all. 10 is the worst pain you can imagine.
                        </p>
                        <div style={{ textAlign: "center", marginBottom: "24px" }}>
                            <span style={{ font: "800 72px/1 'Figtree',sans-serif", color: painColor }}>
                                {draft.painScore}
                            </span>
                            <div style={{ font: "600 16px 'Figtree',sans-serif", color: painColor, marginTop: "4px" }}>
                                {painText}
                            </div>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={10}
                            step={1}
                            value={draft.painScore}
                            onChange={(e) => update({ painScore: Number(e.target.value) })}
                            style={{ width: "100%", accentColor: painColor, cursor: "pointer", height: "8px" }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                            <span style={{ font: "400 13px 'Figtree',sans-serif", color: "#4f6478" }}>0 — No pain</span>
                            <span style={{ font: "400 13px 'Figtree',sans-serif", color: "#4f6478" }}>10 — Worst</span>
                        </div>
                    </div>
                )}

                {/* ── History ───────────────────────────────────────────── */}
                {stepId === "history" && (
                    <div>
                        <h1 style={{ font: "700 24px/1.2 'Figtree',sans-serif", color: "#022449", marginBottom: "8px" }}>
                            Any past health conditions?
                        </h1>
                        <p style={{ font: "400 15px/1.55 'Figtree',sans-serif", color: "#4f6478", marginBottom: "8px" }}>
                            This is optional — skip if none apply to you.
                        </p>
                        <p style={{ font: "400 14px/1.5 'Figtree',sans-serif", color: "#7090a8", marginBottom: "24px" }}>
                            Examples: diabetes, high blood pressure, previous surgeries, cancer, heart conditions, kidney disease.
                        </p>
                        <textarea
                            value={draft.history}
                            onChange={(e) => update({ history: e.target.value })}
                            placeholder="e.g. I had knee surgery in 2021 and I have type 2 diabetes."
                            rows={4}
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: "12px",
                                border: "1.5px solid #c8d8e8",
                                font: "400 16px/1.5 'Figtree',sans-serif",
                                color: "#022449",
                                background: "#fff",
                                resize: "none",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                            onFocus={(e) => (e.target.style.borderColor = "#1b7d0e")}
                            onBlur={(e) => (e.target.style.borderColor = "#c8d8e8")}
                        />
                        <p style={{ font: "400 13px 'Figtree',sans-serif", color: "#7090a8", marginTop: "8px" }}>
                            Only you and your specialist can see this. Leave it blank if nothing applies.
                        </p>
                    </div>
                )}

                {/* ── Medications ───────────────────────────────────────── */}
                {stepId === "medications" && (
                    <div>
                        <h1 style={{ font: "700 24px/1.2 'Figtree',sans-serif", color: "#022449", marginBottom: "8px" }}>
                            Are you taking any medications?
                        </h1>
                        <p style={{ font: "400 15px/1.55 'Figtree',sans-serif", color: "#4f6478", marginBottom: "8px" }}>
                            This is optional — skip if none apply to you.
                        </p>
                        <p style={{ font: "400 14px/1.5 'Figtree',sans-serif", color: "#7090a8", marginBottom: "24px" }}>
                            Include prescribed medicines, over-the-counter drugs, herbal remedies, or vitamins and supplements.
                        </p>
                        <textarea
                            value={draft.medications}
                            onChange={(e) => update({ medications: e.target.value })}
                            placeholder="e.g. Lisinopril 10mg daily, ibuprofen when pain is bad, vitamin D."
                            rows={4}
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: "12px",
                                border: "1.5px solid #c8d8e8",
                                font: "400 16px/1.5 'Figtree',sans-serif",
                                color: "#022449",
                                background: "#fff",
                                resize: "none",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                            onFocus={(e) => (e.target.style.borderColor = "#1b7d0e")}
                            onBlur={(e) => (e.target.style.borderColor = "#c8d8e8")}
                        />
                    </div>
                )}

                {/* ── Red flags ─────────────────────────────────────────── */}
                {stepId === "redFlags" && (
                    <div>
                        <h1 style={{ font: "700 24px/1.2 'Figtree',sans-serif", color: "#022449", marginBottom: "8px" }}>
                            A few safety questions
                        </h1>
                        <p style={{ font: "400 15px/1.55 'Figtree',sans-serif", color: "#4f6478", marginBottom: "24px" }}>
                            Please answer every question honestly. This helps us make sure you get the right level of care.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {RED_FLAG_QUESTIONS.map((q, i) => {
                                const val = draft.redFlags[q.id];
                                const answered = val !== undefined;
                                return (
                                    <div
                                        key={q.id}
                                        style={{
                                            background: "#fff",
                                            border: answered ? "1.5px solid #c8d8e8" : "1.5px solid #c8d8e8",
                                            borderRadius: "12px",
                                            padding: "14px 16px",
                                        }}
                                    >
                                        <p style={{ font: "400 14px/1.5 'Figtree',sans-serif", color: "#022449", marginBottom: "12px" }}>
                                            <span style={{ font: "600 13px 'Figtree',sans-serif", color: "#7090a8", marginRight: "8px" }}>
                                                {i + 1}.
                                            </span>
                                            {q.label}
                                        </p>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                type="button"
                                                onClick={() => { update({ redFlags: { ...draft.redFlags, [q.id]: false } }); setValidationError(null); }}
                                                style={{
                                                    flex: 1,
                                                    padding: "10px",
                                                    borderRadius: "8px",
                                                    border: val === false ? "2px solid #1b7d0e" : "1.5px solid #c8d8e8",
                                                    background: val === false ? "#e8f7e5" : "#f4f8fb",
                                                    color: val === false ? "#1b7d0e" : "#4f6478",
                                                    font: `${val === false ? "700" : "500"} 14px 'Figtree',sans-serif`,
                                                    cursor: "pointer",
                                                    WebkitTapHighlightColor: "transparent",
                                                }}
                                            >
                                                No
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { update({ redFlags: { ...draft.redFlags, [q.id]: true } }); setValidationError(null); }}
                                                style={{
                                                    flex: 1,
                                                    padding: "10px",
                                                    borderRadius: "8px",
                                                    border: val === true ? "2px solid #c94f00" : "1.5px solid #c8d8e8",
                                                    background: val === true ? "#fff0e8" : "#f4f8fb",
                                                    color: val === true ? "#c94f00" : "#4f6478",
                                                    font: `${val === true ? "700" : "500"} 14px 'Figtree',sans-serif`,
                                                    cursor: "pointer",
                                                    WebkitTapHighlightColor: "transparent",
                                                }}
                                            >
                                                Yes
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Review ────────────────────────────────────────────── */}
                {stepId === "review" && (
                    <div>
                        <h1 style={{ font: "700 24px/1.2 'Figtree',sans-serif", color: "#022449", marginBottom: "8px" }}>
                            Review your answers
                        </h1>
                        <p style={{ font: "400 15px/1.55 'Figtree',sans-serif", color: "#4f6478", marginBottom: "24px" }}>
                            Everything look right? You can go back to change anything before submitting.
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {[
                                { label: "Your concern", value: draft.complaint },
                                { label: "Body area", value: BODY_REGIONS.find(r => r.key === draft.bodyRegion)?.label ?? draft.bodyRegion },
                                { label: "When it started", value: draft.onset },
                                { label: "Pain level", value: `${draft.painScore}/10 — ${painLabel(draft.painScore).text}` },
                                ...(draft.history ? [{ label: "Past conditions", value: draft.history }] : []),
                                ...(draft.medications ? [{ label: "Medications", value: draft.medications }] : []),
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    style={{
                                        background: "#fff",
                                        border: "1.5px solid #d9e3ec",
                                        borderRadius: "12px",
                                        padding: "14px 16px",
                                    }}
                                >
                                    <div style={{ font: "600 12px 'Figtree',sans-serif", color: "#7090a8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                                        {item.label}
                                    </div>
                                    <div style={{ font: "400 15px 'Figtree',sans-serif", color: "#022449" }}>
                                        {item.value || <em style={{ color: "#c90000" }}>Not provided</em>}
                                    </div>
                                </div>
                            ))}

                            <div
                                style={{
                                    background: "#fff8e8",
                                    border: "1.5px solid #f0d070",
                                    borderRadius: "12px",
                                    padding: "14px 16px",
                                }}
                            >
                                <div style={{ font: "600 12px 'Figtree',sans-serif", color: "#7090a8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                                    Safety check
                                </div>
                                <div style={{ font: "400 14px 'Figtree',sans-serif", color: "#7a4f00" }}>
                                    {Object.values(draft.redFlags).filter(Boolean).length} concern(s) flagged out of{" "}
                                    {RED_FLAG_QUESTIONS.length} questions
                                </div>
                            </div>
                        </div>

                        {submitError && (
                            <div style={{ marginTop: "16px", background: "#fff0ef", border: "1.5px solid #f9b8b8", borderRadius: "12px", padding: "12px 16px", font: "400 14px 'Figtree',sans-serif", color: "#c90000" }}>
                                {submitError}
                            </div>
                        )}
                    </div>
                )}

                {/* Validation error */}
                {validationError && (
                    <div style={{ marginTop: "16px", background: "#fff0ef", border: "1.5px solid #f9b8b8", borderRadius: "12px", padding: "12px 16px", font: "400 14px 'Figtree',sans-serif", color: "#c90000" }}>
                        {validationError}
                    </div>
                )}
            </div>

            {/* Fixed bottom nav */}
            <div style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                background: "#fff",
                borderTop: "1px solid #d9e3ec",
                padding: "16px 20px",
                zIndex: 10,
            }}>
                <div style={{ maxWidth: "520px", margin: "0 auto", display: "flex", gap: "12px" }}>
                    {prevStep && (
                        <button
                            type="button"
                            onClick={() => { setValidationError(null); router.push(`/app/intake/${prevStep.id}`); }}
                            style={{
                                padding: "14px 20px",
                                borderRadius: "12px",
                                border: "1.5px solid #c8d8e8",
                                background: "#fff",
                                color: "#022449",
                                font: "600 15px 'Figtree',sans-serif",
                                cursor: "pointer",
                                WebkitTapHighlightColor: "transparent",
                                minWidth: "90px",
                            }}
                        >
                            Back
                        </button>
                    )}
                    {stepId === "review" ? (
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={onSubmit}
                            style={{
                                flex: 1,
                                padding: "14px 20px",
                                borderRadius: "12px",
                                border: "none",
                                background: submitting ? "#a8c8a0" : "#1b7d0e",
                                color: "#fff",
                                font: "700 16px 'Figtree',sans-serif",
                                cursor: submitting ? "not-allowed" : "pointer",
                                WebkitTapHighlightColor: "transparent",
                            }}
                        >
                            {submitting ? "Submitting…" : "Submit intake"}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={goNext}
                            style={{
                                flex: 1,
                                padding: "14px 20px",
                                borderRadius: "12px",
                                border: "none",
                                background: "#1b7d0e",
                                color: "#fff",
                                font: "700 16px 'Figtree',sans-serif",
                                cursor: "pointer",
                                WebkitTapHighlightColor: "transparent",
                            }}
                        >
                            Continue
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
