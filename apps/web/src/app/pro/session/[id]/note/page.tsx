"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type NoteFields = {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
};
type OutcomeMeasures = { pain: string; function: string; flexion: string };
type NextStep = "follow-up" | "refer" | "discharge";

type AppointmentSnap = {
    type: string;
    startsAt: string;
    patient: { user: { name: string } } | null;
};

const NAV = "#022449";
const GREEN = "#1b7d0e";
const MUTED = "#4f6478";
const BORDER = "#d9e3ec";

export default function PhysioNotePage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();

    const [note, setNote] = useState<NoteFields>({ subjective: "", objective: "", assessment: "", plan: "" });
    const [outcomes, setOutcomes] = useState<OutcomeMeasures>({ pain: "", function: "", flexion: "" });
    const [nextStep, setNextStep] = useState<NextStep>("follow-up");
    const [summary, setSummary] = useState("");
    const [appt, setAppt] = useState<AppointmentSnap | null>(null);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [signing, setSigning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const saveTimer = useRef<ReturnType<typeof setTimeout>>();

    // Load appointment + existing note
    useEffect(() => {
        fetch(`/api/proxy/sessions/${params.id}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data: { type?: string; startsAt?: string; patient?: { user?: { name?: string } } } | null) => {
                if (data) {
                    setAppt({
                        type: data.type ?? "Session",
                        startsAt: data.startsAt ?? new Date().toISOString(),
                        patient: data.patient?.user?.name ? { user: { name: data.patient.user.name } } : null,
                    });
                }
            })
            .catch(() => {});

        fetch(`/api/proxy/sessions/${params.id}/notes`)
            .then((r) => (r.ok ? r.json() : null))
            .then((n: NoteFields | null) => {
                if (n) {
                    setNote({
                        subjective: n.subjective ?? "",
                        objective: n.objective ?? "",
                        assessment: n.assessment ?? "",
                        plan: n.plan ?? "",
                    });
                }
            })
            .catch(() => {});
    }, [params.id]);

    const persistNote = useCallback((n: NoteFields) => {
        setSaveStatus("saving");
        const om: Record<string, number | null> = {};
        if (outcomes.pain) om.pain = Number(outcomes.pain);
        if (outcomes.function) om.function = Number(outcomes.function);
        if (outcomes.flexion) om.flexion = Number(outcomes.flexion);
        fetch("/api/proxy/sessions/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appointmentId: params.id, ...n, outcomeMeasures: om }),
        })
            .then(() => setSaveStatus("saved"))
            .catch(() => setSaveStatus("idle"));
    }, [params.id, outcomes]);

    function updateNote(field: keyof NoteFields, value: string) {
        const updated = { ...note, [field]: value };
        setNote(updated);
        setSaveStatus("idle");
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => persistNote(updated), 1500);
    }

    async function onSign() {
        setSigning(true);
        setError(null);
        try {
            const res = await fetch("/api/proxy/sessions/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appointmentId: params.id,
                    ...note,
                    outcomeMeasures: {
                        pain: outcomes.pain ? Number(outcomes.pain) : null,
                        function: outcomes.function ? Number(outcomes.function) : null,
                        flexion: outcomes.flexion ? Number(outcomes.flexion) : null,
                    },
                }),
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error((b as { message?: string }).message ?? "Failed to save note");
            }
            // Phase 6 will implement actual signing (signedAt / signedBy lock).
            // For now, saving the note is sufficient and the physio is redirected.
            if (nextStep === "refer") {
                router.push(`/pro/referrals?appointmentId=${params.id}`);
            } else {
                router.push("/pro");
            }
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setSigning(false);
        }
    }

    const canSign = note.assessment.trim().length > 0 && note.plan.trim().length > 0;

    const typeName = appt ? (appt.type.charAt(0) + appt.type.slice(1).toLowerCase()) : "Session";
    const dateLine = appt ? new Date(appt.startsAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

    const field: React.CSSProperties = { display: "block", width: "100%", border: "1px solid #b4c4d3", borderRadius: 10, padding: "10px 12px", font: "15px/1.5 'Figtree', sans-serif", background: "#fff", color: NAV };
    const lab: React.CSSProperties = { display: "block", font: "600 13px 'Figtree', sans-serif", marginBottom: 6, color: NAV };

    const nextSteps: { id: NextStep; label: string; desc: string }[] = [
        { id: "follow-up", label: "Follow-up", desc: "Book the next session" },
        { id: "refer", label: "Refer", desc: "Send to another specialist" },
        { id: "discharge", label: "Discharge", desc: "Goals met, write summary" },
    ];

    const checks = [
        { label: "Assessment written", done: note.assessment.trim().length > 0 },
        { label: "Plan written", done: note.plan.trim().length > 0 },
        { label: "Next step chosen", done: true },
        { label: "Patient summary checked", done: summary.trim().length > 0 },
    ];

    return (
        <div style={{ width: "100%", minHeight: "100vh", background: "#f4f8fb", fontFamily: "'Figtree', system-ui, sans-serif", color: NAV }}>
            {/* Rainbow stripe */}
            <div style={{ height: 5, background: "linear-gradient(90deg,#4eb91e 0%,#0eaf90 50%,#076889 100%)" }} />

            {/* Header */}
            <div style={{ height: 64, background: "#fff", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 16, padding: "0 24px" }}>
                <div>
                    <div style={{ font: "700 16px 'Figtree', sans-serif" }}>
                        Session note: {appt?.patient?.user?.name ?? "Patient"}
                    </div>
                    <div style={{ font: "400 13px 'Figtree', sans-serif", color: MUTED }}>
                        {typeName} · Video{dateLine ? ` · ${dateLine}` : ""}
                    </div>
                </div>
                <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 99, font: "600 12px 'Figtree', sans-serif", background: "#fdf1d8", color: "#7a4f00", marginLeft: 8 }}>
                    Not signed
                </span>
                <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 99, font: "600 12px 'Figtree', sans-serif", background: "#e3f4e8", color: "#1d5c34" }}>
                    {saveStatus === "saved" ? "Saved just now" : saveStatus === "saving" ? "Saving…" : "Draft"}
                </span>
                <button
                    onClick={() => router.push("/pro")}
                    style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 44, padding: "0 20px", borderRadius: 10, background: "#fff", color: NAV, border: `1px solid #c3d1de`, font: "600 15px 'Figtree', sans-serif", cursor: "pointer" }}
                >
                    Back to patient record
                </button>
            </div>

            {/* Body */}
            <div style={{ display: "flex", gap: 20, padding: 24, alignItems: "flex-start" }}>

                {/* Main column */}
                <main style={{ flex: 1, minWidth: 0, display: "grid", gap: 16 }}>

                    {/* SOAP note */}
                    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
                        <h2 style={{ font: "700 18px 'Figtree', sans-serif", margin: 0 }}>Note</h2>
                        <p style={{ font: "400 14px 'Figtree', sans-serif", color: MUTED, marginTop: 2, marginBottom: 16 }}>
                            Filled from the intake form and your notes during the call. Edit anything.
                        </p>
                        <div style={{ display: "grid", gap: 14 }}>
                            {(["subjective", "objective", "assessment", "plan"] as Array<keyof NoteFields>).map((f) => (
                                <div key={f}>
                                    <span style={lab}>
                                        {f === "subjective" ? "Subjective: what the patient reports" :
                                         f === "objective" ? "Objective: what you found" :
                                         f === "assessment" ? "Assessment *" :
                                         "Plan *"}
                                    </span>
                                    <textarea
                                        value={note[f]}
                                        onChange={(e) => updateNote(f, e.target.value)}
                                        rows={3}
                                        style={{ ...field, minHeight: 76, resize: "vertical" }}
                                        placeholder={
                                            f === "subjective" ? "What the patient told you" :
                                            f === "objective" ? "What you observed and measured" :
                                            f === "assessment" ? "Your clinical assessment" :
                                            "Treatment plan and next steps"
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Outcome measures */}
                    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
                        <h2 style={{ font: "700 18px 'Figtree', sans-serif", margin: 0 }}>Outcome measures</h2>
                        <p style={{ font: "400 14px 'Figtree', sans-serif", color: MUTED, marginTop: 2, marginBottom: 16 }}>
                            Saved as numbers so progress can be charted.
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
                            {[
                                { key: "pain" as keyof OutcomeMeasures, label: "Pain now (0 to 10)" },
                                { key: "function" as keyof OutcomeMeasures, label: "Function score (0 to 100)" },
                                { key: "flexion" as keyof OutcomeMeasures, label: "Flexion (degrees)" },
                            ].map(({ key, label }) => (
                                <div key={key}>
                                    <span style={lab}>{label}</span>
                                    <input
                                        type="number"
                                        value={outcomes[key]}
                                        onChange={(e) => setOutcomes((p) => ({ ...p, [key]: e.target.value }))}
                                        style={{ width: 84, minHeight: 44, border: "1px solid #b4c4d3", borderRadius: 10, textAlign: "center", font: "600 16px 'Figtree', sans-serif", background: "#fff", color: NAV }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Next step */}
                    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
                        <h2 style={{ font: "700 18px 'Figtree', sans-serif", margin: 0 }}>Next step *</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 14 }}>
                            {nextSteps.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setNextStep(s.id)}
                                    style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 14px", border: nextStep === s.id ? `1.5px solid ${GREEN}` : "1.5px solid #c3d1de", borderRadius: 12, background: nextStep === s.id ? "#e6f4e1" : "#fff", font: "600 14px 'Figtree', sans-serif", cursor: "pointer", textAlign: "left" }}
                                >
                                    <span style={{ width: 18, height: 18, borderRadius: "50%", border: nextStep === s.id ? `2px solid ${GREEN}` : "2px solid #7d93a8", background: nextStep === s.id ? `radial-gradient(${GREEN} 45%, transparent 50%)` : undefined, flexShrink: 0 }} />
                                    <div>
                                        {s.label}
                                        <div style={{ font: "400 12px 'Figtree', sans-serif", color: MUTED }}>{s.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {nextStep === "follow-up" && (
                            <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "#eef3f8" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ font: "600 14px 'Figtree', sans-serif" }}>Schedule a follow-up</div>
                                    <div style={{ font: "400 13px 'Figtree', sans-serif", color: MUTED }}>Book the next session for this patient</div>
                                </div>
                                <button
                                    onClick={() => router.push("/pro")}
                                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 38, padding: "0 16px", borderRadius: 10, background: "#fff", color: NAV, border: `1px solid #c3d1de`, font: "600 14px 'Figtree', sans-serif", cursor: "pointer" }}
                                >
                                    Choose time
                                </button>
                            </div>
                        )}
                    </div>
                </main>

                {/* Sidebar */}
                <aside style={{ flex: "0 0 380px", display: "grid", gap: 16 }}>
                    {/* Patient summary */}
                    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ font: "700 18px 'Figtree', sans-serif", margin: 0 }}>Summary for the patient</h2>
                            <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 99, font: "600 12px 'Figtree', sans-serif", background: "#e3f1f6", color: "#07506b" }}>Draft</span>
                        </div>
                        <p style={{ font: "400 13px 'Figtree', sans-serif", color: MUTED, marginTop: 2, marginBottom: 12 }}>
                            Plain words. The patient reads this, not your clinical note.
                        </p>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            rows={8}
                            placeholder={"Write a plain-language summary of what you found, what to do, and when to come back.\n\nStop and message me if the pain becomes sharp or numbness develops."}
                            style={{ ...field, minHeight: 200, resize: "vertical", fontSize: 14 }}
                        />
                    </div>

                    {/* Sign-off checklist */}
                    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
                        <h2 style={{ font: "700 16px 'Figtree', sans-serif", margin: 0 }}>Before you sign</h2>
                        <div style={{ marginTop: 8 }}>
                            {checks.map((c) => (
                                <div key={c.label} style={{ display: "flex", gap: 8, alignItems: "center", font: "500 14px 'Figtree', sans-serif", padding: "6px 0" }}>
                                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: c.done ? GREEN : "#fff", border: c.done ? `2px solid ${GREEN}` : "2px solid #b4c4d3", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", font: "700 12px 'Figtree', sans-serif", flexShrink: 0 }}>
                                        {c.done ? "✓" : ""}
                                    </span>
                                    {c.label}
                                </div>
                            ))}
                        </div>
                        {error && <p style={{ font: "400 13px 'Figtree', sans-serif", color: "#b91c1c", marginTop: 8 }}>{error}</p>}
                        <button
                            onClick={onSign}
                            disabled={!canSign || signing}
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: 44, marginTop: 12, borderRadius: 10, background: canSign && !signing ? GREEN : "#9db8a0", color: "#fff", font: "600 15px 'Figtree', sans-serif", border: 0, cursor: canSign && !signing ? "pointer" : "not-allowed" }}
                        >
                            {signing ? "Saving…" : "Sign and complete session"}
                        </button>
                        <p style={{ font: "400 12px/1.5 'Figtree', sans-serif", color: MUTED, marginTop: 10 }}>
                            Signing locks the note. Later changes are added as dated addenda. Your payment is released 24 hours after signing if no complaint is raised.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
