"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DailyCallFrame } from "@/components/daily-call";

type JoinData = {
    roomUrl: string;
    token: string;
    appointment: { id: string; startsAt: string; endsAt: string };
};

type SessionData = {
    id: string;
    type: string;
    mode: string;
    startsAt: string;
    endsAt: string;
    intake: {
        complaint: string;
        bodyRegion: string;
        painScore: number;
        triage: { level: string } | null;
    } | null;
    patient: {
        dob: string | null;
        sex: string | null;
        location: string | null;
        user: { name: string };
    } | null;
    notes: Array<{
        id: string;
        subjective: string | null;
        objective: string | null;
        assessment: string | null;
        plan: string | null;
    }>;
};

type Exercise = {
    id: string;
    name: string;
    region: string;
    cues: string;
    difficulty: number;
    clinicalReview: boolean;
};

type NoteFields = { subjective: string; objective: string; assessment: string; plan: string };
type Tab = "notes" | "exercises" | "plan" | "refer";

const NAV = "#022449";
const GREEN = "#1b7d0e";
const BLUE = "#076889";
const GROUND = "#f4f8fb";
const MUTED = "#4f6478";
const BORDER = "#d9e3ec";

function chip(label: string, bg: string, color: string) {
    return { label, bg, color };
}

function triageChip(level: string | null | undefined) {
    if (level === "RED") return chip("Urgent", "#fce4e4", "#7f1d1d");
    if (level === "AMBER") return chip("Caution", "#fdf1d8", "#7a4f00");
    return chip("OK", "#e3f4e8", "#1d5c34");
}

function calcAge(dob: string | null | undefined): string {
    if (!dob) return "—";
    return String(Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)));
}

function fmtDuration(a: SessionData): string {
    const mins = Math.round(
        (new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime()) / 60_000,
    );
    return `${mins} min`;
}

export default function PhysioSessionPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();

    const [join, setJoin] = useState<JoinData | null>(null);
    const [session, setSession] = useState<SessionData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [ending, setEnding] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>("notes");
    const [timeLeft, setTimeLeft] = useState("--:--");
    const [note, setNote] = useState<NoteFields>({ subjective: "", objective: "", assessment: "", plan: "" });
    const [noteStatus, setNoteStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [exercisesLoaded, setExercisesLoaded] = useState(false);
    const [exSearch, setExSearch] = useState("");
    const [exRegion, setExRegion] = useState("");
    const saveTimer = useRef<ReturnType<typeof setTimeout>>();

    // Join + load session data in parallel
    useEffect(() => {
        const id = params.id;
        Promise.all([
            fetch(`/api/proxy/sessions/${id}/join`, { method: "POST" }).then(async (r) => {
                if (!r.ok) {
                    const b = await r.json().catch(() => ({}));
                    throw new Error((b as { message?: string }).message ?? "Could not join");
                }
                return r.json() as Promise<JoinData>;
            }),
            fetch(`/api/proxy/sessions/${id}`).then((r) => (r.ok ? (r.json() as Promise<SessionData>) : null)),
        ])
            .then(([j, s]) => {
                setJoin(j);
                if (s) setSession(s);
            })
            .catch((e) => setError((e as Error).message));
    }, [params.id]);

    // Load existing note after join
    useEffect(() => {
        if (!join) return;
        fetch(`/api/proxy/sessions/${params.id}/notes`)
            .then((r) => (r.ok ? (r.json() as Promise<NoteFields | null>) : null))
            .then((n) => {
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
    }, [join, params.id]);

    // Load exercises on first open of exercises tab
    useEffect(() => {
        if (activeTab !== "exercises" || exercisesLoaded) return;
        fetch("/api/proxy/programs/exercises")
            .then((r) => (r.ok ? (r.json() as Promise<Exercise[]>) : []))
            .then((data) => {
                setExercises(data);
                setExercisesLoaded(true);
            })
            .catch(() => { setExercisesLoaded(true); });
    }, [activeTab, exercisesLoaded]);

    // Countdown timer
    useEffect(() => {
        if (!join?.appointment?.endsAt) return;
        const endsAt = new Date(join.appointment.endsAt).getTime();
        const tick = () => {
            const diff = endsAt - Date.now();
            if (diff <= 0) { setTimeLeft("0:00"); return; }
            const m = Math.floor(diff / 60_000);
            const s = Math.floor((diff % 60_000) / 1000);
            setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [join?.appointment?.endsAt]);

    // Note autosave
    const saveNote = useCallback((n: NoteFields) => {
        setNoteStatus("saving");
        fetch("/api/proxy/sessions/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appointmentId: params.id, ...n, outcomeMeasures: {} }),
        })
            .then(() => setNoteStatus("saved"))
            .catch(() => setNoteStatus("idle"));
    }, [params.id]);

    function updateNote(field: keyof NoteFields, value: string) {
        const updated = { ...note, [field]: value };
        setNote(updated);
        setNoteStatus("idle");
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => saveNote(updated), 1500);
    }

    async function onEnd() {
        setEnding(true);
        await fetch(`/api/proxy/sessions/${params.id}/end`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        }).catch(() => {});
        router.push(`/pro/session/${params.id}/note`);
    }

    if (error) {
        return (
            <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", fontFamily: "'Figtree', system-ui, sans-serif" }}>
                <div>
                    <p style={{ fontSize: 17, fontWeight: 600, color: NAV }}>Can't join right now</p>
                    <p style={{ marginTop: 8, fontSize: 14, color: MUTED }}>{error}</p>
                    <button onClick={() => router.push("/pro")} style={{ marginTop: 24, color: BLUE, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>Go back</button>
                </div>
            </div>
        );
    }

    if (!join) {
        return (
            <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', system-ui, sans-serif" }}>
                <p style={{ fontSize: 14, color: MUTED }}>Joining session…</p>
            </div>
        );
    }

    const patient = session?.patient;
    const intake = session?.intake;
    const tc = triageChip(intake?.triage?.level);
    const typeName = session ? (session.type.charAt(0) + session.type.slice(1).toLowerCase()) : "Session";
    const modeName = session ? (session.mode.charAt(0) + session.mode.slice(1).toLowerCase()) : "Video";

    const filteredEx = exercises.filter((ex) => {
        const q = exSearch.toLowerCase();
        const matchQ = !q || ex.name.toLowerCase().includes(q) || ex.region.toLowerCase().includes(q);
        const matchR = !exRegion || ex.region.toLowerCase() === exRegion.toLowerCase();
        return matchQ && matchR;
    });
    const regions = Array.from(new Set(exercises.map((e) => e.region))).slice(0, 6);

    const roundBtn: React.CSSProperties = {
        minWidth: 64,
        height: 48,
        padding: "0 14px",
        borderRadius: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
        color: NAV,
        border: `1px solid #c3d1de`,
        font: "600 13px 'Figtree', sans-serif",
        cursor: "pointer",
    };

    const tabStyle = (t: Tab): React.CSSProperties => ({
        flex: 1,
        textAlign: "center",
        padding: "12px 4px",
        font: "600 14px 'Figtree', sans-serif",
        color: activeTab === t ? GREEN : MUTED,
        background: "none",
        border: "none",
        borderBottom: activeTab === t ? `3px solid ${GREEN}` : "3px solid transparent",
        cursor: "pointer",
    });

    return (
        <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Figtree', system-ui, sans-serif", background: GROUND, color: NAV, overflow: "hidden" }}>
            {/* Rainbow stripe */}
            <div style={{ height: 5, background: "linear-gradient(90deg,#4eb91e 0%,#0eaf90 50%,#076889 100%)", flexShrink: 0 }} />

            {/* Header */}
            <div style={{ height: 64, flexShrink: 0, background: "#fff", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 16, padding: "0 20px" }}>
                <div>
                    <div style={{ font: "700 16px 'Figtree', sans-serif" }}>Session with {patient?.user?.name ?? "Patient"}</div>
                    <div style={{ font: "400 13px 'Figtree', sans-serif", color: MUTED }}>
                        {typeName} · {modeName}{session ? ` · ${fmtDuration(session)}` : ""}
                    </div>
                </div>
                <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 99, font: "600 12px 'Figtree', sans-serif", background: "#e3f4e8", color: "#1d5c34", marginLeft: 8 }}>
                    Connected
                </span>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ font: "600 11px 'Figtree', sans-serif", color: MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>Time left</div>
                        <div style={{ font: "700 20px 'Figtree', sans-serif" }}>{timeLeft}</div>
                    </div>
                    <button
                        onClick={onEnd}
                        disabled={ending}
                        style={{ display: "inline-flex", alignItems: "center", minHeight: 40, padding: "0 16px", borderRadius: 10, background: ending ? "#999" : "#b42318", color: "#fff", font: "600 14px 'Figtree', sans-serif", border: 0, cursor: ending ? "not-allowed" : "pointer" }}
                    >
                        {ending ? "Ending…" : "End session"}
                    </button>
                </div>
            </div>

            {/* 3-pane body */}
            <div style={{ flex: 1, display: "flex", gap: 16, padding: 16, minHeight: 0, overflow: "hidden" }}>

                {/* ── Left: patient summary ── */}
                <aside style={{ flex: "0 0 300px", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#cfe3ee", flexShrink: 0 }} />
                        <div>
                            <div style={{ font: "700 17px 'Figtree', sans-serif" }}>{patient?.user?.name ?? "Patient"}</div>
                            <div style={{ font: "400 13px 'Figtree', sans-serif", color: MUTED }}>
                                {calcAge(patient?.dob ?? null)}{patient?.sex ? ` · ${patient.sex}` : ""}{patient?.location ? ` · ${patient.location}` : ""}
                            </div>
                        </div>
                    </div>

                    {intake && (
                        <>
                            <div style={{ font: "600 12px 'Figtree', sans-serif", color: MUTED, letterSpacing: "0.04em", textTransform: "uppercase", marginTop: 20 }}>Reason for visit</div>
                            <p style={{ font: "500 15px/1.4 'Figtree', sans-serif", marginTop: 4 }}>{intake.complaint}</p>

                            <div style={{ font: "600 12px 'Figtree', sans-serif", color: MUTED, letterSpacing: "0.04em", textTransform: "uppercase", marginTop: 18 }}>Safety check</div>
                            <div style={{ marginTop: 6 }}>
                                <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 99, font: "600 12px 'Figtree', sans-serif", background: tc.bg, color: tc.color }}>{tc.label}</span>
                                {intake.triage?.level === "AMBER" && <span style={{ font: "400 13px 'Figtree', sans-serif", color: MUTED, marginLeft: 6 }}>Review carefully</span>}
                                {intake.triage?.level === "RED" && <span style={{ font: "400 13px 'Figtree', sans-serif", color: "#7f1d1d", marginLeft: 6 }}>Refer urgently</span>}
                                {(!intake.triage?.level || intake.triage.level === "GREEN") && <span style={{ font: "400 13px 'Figtree', sans-serif", color: MUTED, marginLeft: 6 }}>No red flags</span>}
                            </div>

                            <div style={{ font: "600 12px 'Figtree', sans-serif", color: MUTED, letterSpacing: "0.04em", textTransform: "uppercase", marginTop: 18 }}>Intake answers</div>
                            <div style={{ display: "grid", gap: 8, marginTop: 6, font: "400 14px 'Figtree', sans-serif" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: MUTED }}>Pain now</span>
                                    <b>{intake.painScore} / 10</b>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: MUTED }}>Body region</span>
                                    <b>{intake.bodyRegion}</b>
                                </div>
                            </div>
                        </>
                    )}

                    <div style={{ font: "600 12px 'Figtree', sans-serif", color: MUTED, letterSpacing: "0.04em", textTransform: "uppercase", marginTop: 18 }}>Note status</div>
                    <div style={{ marginTop: 6, font: "400 13px 'Figtree', sans-serif", color: noteStatus === "saved" ? GREEN : noteStatus === "saving" ? BLUE : MUTED }}>
                        {noteStatus === "saved" ? "Saved just now" : noteStatus === "saving" ? "Saving…" : "Not yet saved"}
                    </div>
                </aside>

                {/* ── Center: video ── */}
                <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ flex: 1, borderRadius: 18, background: NAV, position: "relative", overflow: "hidden", minHeight: 0 }}>
                        <DailyCallFrame url={join.roomUrl} token={join.token} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 10, flexShrink: 0, paddingBottom: 4 }}>
                        <button
                            onClick={() => setMicOn((v) => !v)}
                            style={{ ...roundBtn, ...(!micOn ? { background: "#fee2e2", color: "#b91c1c", borderColor: "#b91c1c" } : {}) }}
                        >
                            {micOn ? "Mute" : "Unmute"}
                        </button>
                        <button
                            onClick={() => setCameraOn((v) => !v)}
                            style={{ ...roundBtn, ...(!cameraOn ? { background: "#fee2e2", color: "#b91c1c", borderColor: "#b91c1c" } : {}) }}
                        >
                            {cameraOn ? "Camera" : "No camera"}
                        </button>
                        <button style={roundBtn}>Audio only</button>
                        <button style={roundBtn}>Share screen</button>
                        <button
                            onClick={() => setActiveTab("notes")}
                            style={{ ...roundBtn, background: "#e6f4e1", borderColor: GREEN, color: "#0f5a08" }}
                        >
                            Chat
                        </button>
                    </div>
                </main>

                {/* ── Right: tabs ── */}
                <aside style={{ flex: "0 0 400px", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {/* Tab bar */}
                    <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, padding: "0 8px", flexShrink: 0 }}>
                        {(["notes", "exercises", "plan", "refer"] as Tab[]).map((t) => (
                            <button key={t} onClick={() => setActiveTab(t)} style={tabStyle(t)}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                                {t === "plan" && " (0)"}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        {/* Notes tab */}
                        {activeTab === "notes" && (
                            <div style={{ padding: 16, flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                                {(["subjective", "objective", "assessment", "plan"] as Array<keyof NoteFields>).map((field) => (
                                    <div key={field}>
                                        <label style={{ display: "block", font: "600 12px 'Figtree', sans-serif", color: MUTED, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                                            {field.charAt(0).toUpperCase() + field.slice(1)}
                                        </label>
                                        <textarea
                                            value={note[field]}
                                            onChange={(e) => updateNote(field, e.target.value)}
                                            rows={3}
                                            placeholder={
                                                field === "subjective" ? "Patient's report, symptoms" :
                                                field === "objective" ? "Observed movement, tests" :
                                                field === "assessment" ? "Diagnosis and reasoning" :
                                                "Treatment plan, next steps"
                                            }
                                            style={{ display: "block", width: "100%", border: `1px solid #b4c4d3`, borderRadius: 10, padding: "10px 12px", font: "15px/1.5 'Figtree', sans-serif", background: "#fff", color: NAV, resize: "vertical", minHeight: 72 }}
                                        />
                                    </div>
                                ))}
                                <div style={{ font: "400 12px 'Figtree', sans-serif", color: noteStatus === "saved" ? GREEN : MUTED }}>
                                    {noteStatus === "saved" ? "Saved just now" : noteStatus === "saving" ? "Saving…" : "Changes save automatically."}
                                </div>
                            </div>
                        )}

                        {/* Exercises tab */}
                        {activeTab === "exercises" && (
                            <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", gap: 0, minHeight: 0 }}>
                                <input
                                    aria-label="Search exercises"
                                    value={exSearch}
                                    onChange={(e) => setExSearch(e.target.value)}
                                    placeholder="Search by body area, condition or goal"
                                    style={{ display: "block", width: "100%", minHeight: 42, border: `1px solid #b4c4d3`, borderRadius: 10, padding: "0 12px", font: "14px 'Figtree', sans-serif", color: NAV }}
                                />
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                                    <button
                                        onClick={() => setExRegion("")}
                                        style={{ padding: "4px 10px", borderRadius: 99, font: "600 12px 'Figtree', sans-serif", background: !exRegion ? "#e6f4e1" : "#e3f1f6", color: !exRegion ? "#0f5a08" : "#07506b", border: "none", cursor: "pointer" }}
                                    >
                                        All
                                    </button>
                                    {regions.map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setExRegion(exRegion === r ? "" : r)}
                                            style={{ padding: "4px 10px", borderRadius: 99, font: "600 12px 'Figtree', sans-serif", background: exRegion === r ? "#e6f4e1" : "#e3f1f6", color: exRegion === r ? "#0f5a08" : "#07506b", border: "none", cursor: "pointer" }}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ flex: 1, overflowY: "auto", marginTop: 6 }}>
                                    {!exercisesLoaded && (
                                        <p style={{ font: "400 14px 'Figtree', sans-serif", color: MUTED, padding: "16px 0" }}>Loading exercises…</p>
                                    )}
                                    {exercisesLoaded && filteredEx.length === 0 && (
                                        <p style={{ font: "400 14px 'Figtree', sans-serif", color: MUTED, padding: "16px 0" }}>No exercises match.</p>
                                    )}
                                    {filteredEx.map((ex) => (
                                        <div key={ex.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderTop: `1px solid #e4ebf2` }}>
                                            <div style={{ width: 64, height: 48, borderRadius: 8, background: "#cdddea", flexShrink: 0 }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ font: "600 14px 'Figtree', sans-serif" }}>{ex.name}</div>
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8, background: "#eef3f8", font: "600 12px 'Figtree', sans-serif", marginTop: 2 }}>
                                                    {ex.region}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                                <button style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 34, padding: "0 12px", borderRadius: 10, background: "#fff", color: NAV, border: `1px solid #c3d1de`, font: "600 13px 'Figtree', sans-serif", cursor: "pointer" }}>
                                                    Show
                                                </button>
                                                <button style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 34, padding: "0 12px", borderRadius: 10, background: GREEN, color: "#fff", border: 0, font: "600 13px 'Figtree', sans-serif", cursor: "pointer" }}>
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ flexShrink: 0, borderTop: `1px solid ${BORDER}`, paddingTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ font: "600 14px 'Figtree', sans-serif" }}>0 in the plan</div>
                                        <div style={{ font: "400 12px 'Figtree', sans-serif", color: MUTED }}>Edit doses in the Plan tab</div>
                                    </div>
                                    <button style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 40, padding: "0 16px", borderRadius: 10, background: GREEN, color: "#fff", font: "600 14px 'Figtree', sans-serif", border: 0, cursor: "pointer" }}>
                                        Send plan to patient
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Plan tab */}
                        {activeTab === "plan" && (
                            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                <p style={{ font: "500 15px 'Figtree', sans-serif", color: NAV, textAlign: "center" }}>No exercises added yet.</p>
                                <p style={{ font: "400 13px 'Figtree', sans-serif", color: MUTED, textAlign: "center" }}>Use the Exercises tab to add exercises to this session's plan.</p>
                            </div>
                        )}

                        {/* Refer tab */}
                        {activeTab === "refer" && (
                            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                <p style={{ font: "500 15px 'Figtree', sans-serif", color: NAV, textAlign: "center" }}>Referrals</p>
                                <p style={{ font: "400 13px 'Figtree', sans-serif", color: MUTED, textAlign: "center" }}>Refer this patient to another specialist after the session note is complete.</p>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
