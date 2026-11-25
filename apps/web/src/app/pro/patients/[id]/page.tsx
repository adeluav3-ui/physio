"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const ExerciseViewer = dynamic(() => import("@/components/exercise-viewer"), { ssr: false });

// ── Types ──────────────────────────────────────────────────────────────────

type TriageResult = {
    id: string;
    level: "GREEN" | "FLAG" | "IN_PERSON_REQUIRED";
    reasons: string[];
};

type Intake = {
    id: string;
    complaint: string;
    bodyRegion: string;
    onset: string;
    painScore: number;
    history: string | null;
    medications: string | null;
    redFlagAnswers: { questionId: string; answer: boolean }[];
    createdAt: string;
    triage: TriageResult | null;
};

type PatientProfile = {
    id: string;
    name: string;
    email: string;
    patientProfile: {
        dob: string | null;
        sex: string | null;
        location: string | null;
        emergencyContact: string | null;
    } | null;
};

type SessionNote = {
    id: string;
    subjective: string; objective: string; assessment: string; plan: string;
    signedAt: string | null; createdAt: string;
    addenda: { id: string; body: string; addedAt: string }[];
    appointment: { id: string; startsAt: string };
};

type PatientSummaryDoc = {
    id: string; body: string; approvedAt: string | null;
    appointment: { id: string; startsAt: string };
};

type Appointment = {
    id: string; startsAt: string; endsAt: string; status: string; mode: string; type: string;
};

type Referral = {
    id: string; toDiscipline: string; reason: string; urgency: string; status: string;
    summary: string | null; declineReason: string | null;
    receiver: { user: { name: string } } | null;
};

type Chart = {
    profile: PatientProfile;
    latestIntake: Intake | null;
    appointments: Appointment[];
    referrals: Referral[];
};

type ExerciseItem = {
    id: string; sets: number | null; reps: number | null; holdSeconds: number | null; frequency: string;
    exercise: { id: string; name: string; region: string; joint: string | null; poseKey: string | null; poseData: unknown };
};
type Program = { id: string; startsAt: string; items: ExerciseItem[] };
type LibExercise = {
    id: string; name: string; region: string; joint: string | null;
    poseKey: string | null; poseData: unknown; goal: string | null;
    defaultSets: number; defaultReps: number; defaultHoldSeconds: number;
    clinicalReview: boolean; csvId: string | null;
};
type AddingState = {
    ex: LibExercise; sets: number; reps: number; holdSeconds: number; frequency: string; notes: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

const TRIAGE_COLOR: Record<string, { bg: string; text: string; border: string }> = {
    GREEN: { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
    AMBER: { bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
    RED:   { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
};

function ageFromDob(dob: string | null | undefined): string {
    if (!dob) return "—";
    const years = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return `${years} yrs`;
}

const TABS = ["Overview", "Timeline", "Notes", "Documents", "Referrals", "Messages", "Plan"];

// ── Page ───────────────────────────────────────────────────────────────────

export default function PatientRecordPage() {
    const { id: patientId } = useParams<{ id: string }>();
    const router = useRouter();
    const [tab, setTab] = useState("Overview");
    const [chart, setChart] = useState<Chart | null>(null);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [library, setLibrary] = useState<LibExercise[]>([]);
    const [libQuery, setLibQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [adding, setAdding] = useState<AddingState | null>(null);
    const [addErr, setAddErr] = useState("");
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [previewLibId, setPreviewLibId] = useState<string | null>(null);
    const [threadId, setThreadId] = useState<string | null>(null);
    const [openingThread, setOpeningThread] = useState(false);
    const [notes, setNotes] = useState<SessionNote[] | null>(null);
    const [docs, setDocs] = useState<PatientSummaryDoc[] | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const chartRes = await fetch(`/api/proxy/patients/${patientId}/chart`, { credentials: "include" });
                if (!chartRes.ok) {
                    const body = await chartRes.json().catch(() => ({}));
                    const code = (body as { code?: string }).code;
                    if (code === "FORBIDDEN" || chartRes.status === 403) {
                        setFetchError("You don't have an appointment with this patient yet.");
                    } else if (chartRes.status === 404) {
                        setFetchError("Patient not found.");
                    } else {
                        setFetchError(`Could not load patient record (${chartRes.status}). The API may still be deploying — try refreshing in a moment.`);
                    }
                    setLoading(false);
                    return;
                }
                const chartData = await chartRes.json();

                const [progs, lib] = await Promise.all([
                    fetch(`/api/proxy/programs/patient/${patientId}`, { credentials: "include" })
                        .then(r => r.ok ? r.json() : []),
                    fetch("/api/proxy/programs/exercises?reviewed=true", { credentials: "include" })
                        .then(r => r.ok ? r.json() : []),
                ]);
                setChart(chartData);
                setPrograms(progs ?? []);
                setLibrary(lib ?? []);
            } catch (e) {
                setFetchError(`Network error: ${(e as Error).message}`);
            } finally { setLoading(false); }
        }
        load();
    }, [patientId]);

    const prog = programs[0] ?? null;
    const items = prog?.items ?? [];
    const filteredLib = library.filter(e =>
        !libQuery ||
        e.name.toLowerCase().includes(libQuery.toLowerCase()) ||
        e.region.toLowerCase().includes(libQuery.toLowerCase()) ||
        (e.joint?.toLowerCase().includes(libQuery.toLowerCase()) ?? false),
    );
    const regions = [...new Set(library.map(e => e.region))].slice(0, 6);

    function openAdd(ex: LibExercise) {
        setAdding({ ex, sets: ex.defaultSets, reps: ex.defaultReps, holdSeconds: ex.defaultHoldSeconds, frequency: "Daily", notes: "" });
        setAddErr("");
    }

    async function handleAddItem() {
        if (!adding) return;
        setAddErr("");
        try {
            let programId = prog?.id;
            if (!programId) {
                const r = await fetch("/api/proxy/programs", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ patientId, startsAt: new Date().toISOString(), items: [{ exerciseId: adding.ex.id, sets: adding.sets, reps: adding.reps, holdSeconds: adding.holdSeconds, frequency: adding.frequency, ...(adding.notes && { notes: adding.notes }) }] }),
                });
                if (!r.ok) { const e = await r.json().catch(() => ({})); setAddErr((e as { message?: string }).message ?? "Failed"); return; }
                setPrograms([await r.json()]); setAdding(null); return;
            }
            const r = await fetch(`/api/proxy/programs/${programId}/items`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ exerciseId: adding.ex.id, sets: adding.sets, reps: adding.reps, holdSeconds: adding.holdSeconds, frequency: adding.frequency, ...(adding.notes && { notes: adding.notes }) }),
            });
            if (!r.ok) { const e = await r.json().catch(() => ({})); setAddErr((e as { message?: string }).message ?? "Failed"); return; }
            const newItem: ExerciseItem = await r.json();
            setPrograms(ps => ps.map(p => p.id === programId ? { ...p, items: [...p.items, newItem] } : p));
            setAdding(null);
        } catch { setAddErr("Network error"); }
    }

    async function handleRemoveItem(itemId: string) {
        if (!prog) return;
        setRemovingId(itemId);
        try {
            await fetch(`/api/proxy/programs/${prog.id}/items/${itemId}`, { method: "DELETE" });
            setPrograms(ps => ps.map(p => p.id === prog.id ? { ...p, items: p.items.filter(i => i.id !== itemId) } : p));
        } catch { /* empty */ }
        finally { setRemovingId(null); }
    }

    async function handleSendPlan() {
        if (!prog) return;
        setSending(true);
        try { await fetch(`/api/proxy/programs/${prog.id}/send`, { method: "POST" }); setSent(true); setTimeout(() => setSent(false), 3000); }
        catch { /* empty */ }
        finally { setSending(false); }
    }

    async function openThread() {
        setOpeningThread(true);
        try {
            const r = await fetch("/api/proxy/threads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ recipientId: patientId }),
            });
            if (!r.ok) return;
            const thread = await r.json() as { id: string };
            setThreadId(thread.id);
            router.push(`/pro/messages/${thread.id}`);
        } catch { /* empty */ }
        finally { setOpeningThread(false); }
    }

    useEffect(() => {
        if (tab === "Notes" && notes === null) {
            fetch(`/api/proxy/patients/${patientId}/notes`, { credentials: "include" })
                .then(r => r.ok ? r.json() : [])
                .then((data: SessionNote[]) => setNotes(data))
                .catch(() => setNotes([]));
        }
        if (tab === "Documents" && docs === null) {
            fetch(`/api/proxy/patients/${patientId}/documents`, { credentials: "include" })
                .then(r => r.ok ? r.json() : [])
                .then((data: PatientSummaryDoc[]) => setDocs(data))
                .catch(() => setDocs([]));
        }
    }, [tab, patientId, notes, docs]);

    if (loading) return (
        <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree',system-ui,sans-serif" }}>
            <div className="muted" style={{ font: "400 15px 'Figtree',sans-serif" }}>Loading patient record…</div>
        </div>
    );

    if (fetchError) return (
        <div style={{ maxWidth: "520px", margin: "40px auto", padding: "0 20px", fontFamily: "'Figtree',system-ui,sans-serif" }}>
            <div className="card" style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "20px" }}>
                <div style={{ font: "700 16px 'Figtree',sans-serif", color: "#991b1b", marginBottom: "8px" }}>Could not load patient record</div>
                <div style={{ font: "400 14px 'Figtree',sans-serif", color: "#7f1d1d" }}>{fetchError}</div>
            </div>
            <button type="button" className="btn btn2" style={{ marginTop: "16px" }} onClick={() => window.location.reload()}>Try again</button>
        </div>
    );

    const p = chart?.profile;
    const intake = chart?.latestIntake;
    const triage = intake?.triage;
    const triageColors = triage ? TRIAGE_COLOR[triage.level] : null;

    return (
        <>
            {/* Header */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#cfe3ee", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", font: "700 22px 'Figtree',sans-serif", color: "#022449" }}>
                        {p?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                        <h1 style={{ font: "700 24px 'Figtree',sans-serif", margin: 0 }}>{p?.name ?? "Patient"}</h1>
                        <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif", marginTop: "2px" }}>
                            {ageFromDob(p?.patientProfile?.dob)}
                            {p?.patientProfile?.sex ? ` · ${p.patientProfile.sex}` : ""}
                            {p?.patientProfile?.location ? ` · ${p.patientProfile.location}` : ""}
                            {" · "}
                            <Link href="/pro/patients" style={{ color: "#1b7d0e" }}>All patients</Link>
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    {chart?.appointments[0] && (
                        <Link href={`/pro/session/${chart.appointments[0].id}`} className="btn" style={{ minHeight: "40px" }}>Start session</Link>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", flexWrap: "wrap", borderBottom: "1px solid #d9e3ec", marginTop: "20px" }}>
                {TABS.map(t => (
                    <button key={t} type="button" className={`rtab${tab === t ? " rtabon" : ""}`} onClick={() => setTab(t)}>{t}</button>
                ))}
            </div>

            {/* ── Overview tab ── */}
            {tab === "Overview" && (
                <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>

                    {/* Triage result */}
                    {triage && triageColors ? (
                        <div className="card" style={{ borderLeft: `4px solid ${triageColors.border}`, background: triageColors.bg }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                                <div>
                                    <div style={{ font: "700 13px 'Figtree',sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", color: triageColors.text }}>
                                        Triage · {triage.level}
                                    </div>
                                    <div style={{ font: "400 13px 'Figtree',sans-serif", color: triageColors.text, marginTop: "2px" }}>
                                        Completed {new Date(intake!.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" })}
                                    </div>
                                </div>
                            </div>
                            {triage.reasons.length > 0 && (
                                <ul style={{ margin: "10px 0 0", paddingLeft: "18px", display: "grid", gap: "4px" }}>
                                    {triage.reasons.map((r, i) => (
                                        <li key={i} style={{ font: "400 13px 'Figtree',sans-serif", color: triageColors.text }}>{r}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : (
                        <div className="card" style={{ color: "#4f6478", font: "400 14px 'Figtree',sans-serif" }}>
                            No triage on file.
                        </div>
                    )}

                    {/* Intake details */}
                    {intake && (
                        <div className="card">
                            <h2 style={{ font: "700 17px 'Figtree',sans-serif", margin: "0 0 14px" }}>Intake</h2>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "14px" }}>
                                <Detail label="Complaint" value={intake.complaint} />
                                <Detail label="Body region" value={intake.bodyRegion} />
                                <Detail label="Onset" value={intake.onset} />
                                <Detail label="Pain score" value={`${intake.painScore} / 10`} />
                                {intake.history && <Detail label="Medical history" value={intake.history} wide />}
                                {intake.medications && <Detail label="Medications" value={intake.medications} wide />}
                            </div>

                            {/* Red flag answers */}
                            {intake.redFlagAnswers?.length > 0 && (
                                <div style={{ marginTop: "16px" }}>
                                    <div style={{ font: "600 13px 'Figtree',sans-serif", color: "#4f6478", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                                        Red flag screening
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                        {intake.redFlagAnswers
                                            .filter(a => a.answer)
                                            .map((a, i) => (
                                                <span key={i} style={{ padding: "3px 10px", borderRadius: "20px", background: "#fef2f2", border: "1px solid #fecaca", font: "500 12px 'Figtree',sans-serif", color: "#991b1b" }}>
                                                    {a.questionId.replace(/_/g, " ")}
                                                </span>
                                            ))}
                                        {intake.redFlagAnswers.every(a => !a.answer) && (
                                            <span style={{ font: "400 13px 'Figtree',sans-serif", color: "#166534" }}>No red flags reported</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Demographics */}
                    {p?.patientProfile && (
                        <div className="card">
                            <h2 style={{ font: "700 17px 'Figtree',sans-serif", margin: "0 0 14px" }}>Patient details</h2>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "14px" }}>
                                <Detail label="Date of birth" value={p.patientProfile.dob ? new Date(p.patientProfile.dob).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" }) : "—"} />
                                <Detail label="Sex" value={p.patientProfile.sex ?? "—"} />
                                <Detail label="Location" value={p.patientProfile.location ?? "—"} />
                                <Detail label="Emergency contact" value={p.patientProfile.emergencyContact ?? "—"} />
                                <Detail label="Email" value={p.email} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Timeline tab ── */}
            {tab === "Timeline" && (
                <div style={{ display: "grid", gap: "12px", marginTop: "20px" }}>
                    {(!chart?.appointments.length) ? (
                        <div className="card" style={{ color: "#4f6478", font: "400 15px 'Figtree',sans-serif" }}>No sessions yet.</div>
                    ) : chart.appointments.map(a => (
                        <div key={a.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                            <div>
                                <div style={{ font: "600 15px 'Figtree',sans-serif" }}>
                                    {new Date(a.startsAt).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" })}
                                    {" · "}{new Date(a.startsAt).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Lagos" })}
                                </div>
                                <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif" }}>{a.mode} · {a.type}</div>
                            </div>
                            <span className={`chip${a.status === "CANCELLED" ? " bad" : a.status === "COMPLETED" ? " ok" : ""}`}>
                                {a.status.replace(/_/g, " ").toLowerCase()}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Notes tab ── */}
            {tab === "Notes" && (
                <div style={{ display: "grid", gap: "16px", marginTop: "20px" }}>
                    {notes === null ? (
                        <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif" }}>Loading…</div>
                    ) : notes.length === 0 ? (
                        <div className="card" style={{ color: "#4f6478", font: "400 14px 'Figtree',sans-serif" }}>
                            No session notes yet. Notes are written during or after each session.
                        </div>
                    ) : notes.map(n => (
                        <div key={n.id} className="card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
                                <div style={{ font: "600 15px 'Figtree',sans-serif", color: "#022449" }}>
                                    {new Date(n.appointment.startsAt).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" })}
                                </div>
                                {n.signedAt ? <span className="chip ok">Signed</span> : <span className="chip">Draft</span>}
                            </div>
                            <div style={{ display: "grid", gap: "10px" }}>
                                {([
                                    { label: "Subjective", value: n.subjective },
                                    { label: "Objective", value: n.objective },
                                    { label: "Assessment", value: n.assessment },
                                    { label: "Plan", value: n.plan },
                                ] as { label: string; value: string }[]).map(({ label, value }) => (
                                    <div key={label}>
                                        <div style={{ font: "600 11px 'Figtree',sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", color: "#4f6478", marginBottom: "3px" }}>{label}</div>
                                        <div style={{ font: "400 14px 'Figtree',sans-serif", color: "#022449", whiteSpace: "pre-wrap" }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                            {n.addenda.length > 0 && (
                                <div style={{ marginTop: "12px", borderTop: "1px solid #e8f0f7", paddingTop: "12px" }}>
                                    <div style={{ font: "600 12px 'Figtree',sans-serif", color: "#4f6478", marginBottom: "8px" }}>Addenda</div>
                                    {n.addenda.map(ad => (
                                        <div key={ad.id} style={{ font: "400 13px 'Figtree',sans-serif", color: "#022449", marginBottom: "6px" }}>
                                            <span style={{ color: "#4f6478", marginRight: "6px" }}>{new Date(ad.addedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" })}</span>
                                            {ad.body}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Documents tab ── */}
            {tab === "Documents" && (
                <div style={{ display: "grid", gap: "16px", marginTop: "20px" }}>
                    {docs === null ? (
                        <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif" }}>Loading…</div>
                    ) : docs.length === 0 ? (
                        <div className="card" style={{ color: "#4f6478", font: "400 14px 'Figtree',sans-serif" }}>
                            No patient summaries yet. Summaries are written after each completed session.
                        </div>
                    ) : docs.map(doc => (
                        <div key={doc.id} className="card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                                <div style={{ font: "600 15px 'Figtree',sans-serif", color: "#022449" }}>
                                    {new Date(doc.appointment.startsAt).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" })} · Patient summary
                                </div>
                                {doc.approvedAt ? <span className="chip ok">Approved</span> : <span className="chip">Draft</span>}
                            </div>
                            <p style={{ font: "400 14px 'Figtree',sans-serif", color: "#022449", margin: 0, whiteSpace: "pre-wrap" }}>
                                {doc.body}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Referrals tab ── */}
            {tab === "Referrals" && (
                <div style={{ display: "grid", gap: "16px", marginTop: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ font: "400 14px 'Figtree',sans-serif", color: "#4f6478" }}>
                            {chart?.referrals.length ?? 0} referral{(chart?.referrals.length ?? 0) !== 1 ? "s" : ""}
                        </span>
                        <Link href="/pro/referrals" className="btn btn2" style={{ minHeight: "36px", fontSize: "13px" }}>New referral</Link>
                    </div>
                    {!chart?.referrals.length ? (
                        <div className="card" style={{ color: "#4f6478", font: "400 14px 'Figtree',sans-serif" }}>No referrals for this patient yet.</div>
                    ) : chart.referrals.map(ref => (
                        <div key={ref.id} className="card">
                            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                                <div style={{ font: "600 15px 'Figtree',sans-serif", color: "#022449" }}>
                                    {ref.toDiscipline}{ref.receiver ? ` → ${ref.receiver.user.name}` : ""}
                                </div>
                                <span className={`chip${ref.status === "ACCEPTED" ? " ok" : ref.status === "DECLINED" ? " bad" : ""}`}>
                                    {ref.status.toLowerCase()}
                                </span>
                            </div>
                            <div style={{ display: "grid", gap: "6px" }}>
                                <Detail label="Urgency" value={ref.urgency} />
                                <Detail label="Reason" value={ref.reason} wide />
                                {ref.summary && <Detail label="Summary" value={ref.summary} wide />}
                                {ref.declineReason && <Detail label="Decline reason" value={ref.declineReason} wide />}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Messages tab ── */}
            {tab === "Messages" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "16px", marginTop: "20px" }}>
                    <p style={{ font: "400 14px 'Figtree',sans-serif", color: "#4f6478", margin: 0 }}>
                        Open the message thread with {p?.name ?? "this patient"} to send and receive messages.
                    </p>
                    <button
                        type="button"
                        className="btn"
                        onClick={openThread}
                        disabled={openingThread}
                        style={{ minHeight: "44px" }}
                    >
                        {openingThread ? "Opening…" : `Message ${p?.name?.split(" ")[0] ?? "patient"}`}
                    </button>
                    {threadId && (
                        <Link href={`/pro/messages/${threadId}`} style={{ font: "500 14px 'Figtree',sans-serif", color: "#1b7d0e" }}>
                            Go to thread →
                        </Link>
                    )}
                </div>
            )}

            {/* ── Plan tab ── */}
            {tab === "Plan" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "20px", alignItems: "flex-start" }}>
                    {/* Exercise program */}
                    <div style={{ flex: "2 1 460px", minWidth: 0, display: "grid", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                            <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>
                                Exercise program{items.length > 0 ? ` · ${items.length} exercises` : ""}
                            </h2>
                            {sent && <span className="chip ok">Plan sent</span>}
                        </div>

                        {items.length === 0 ? (
                            <div className="card" style={{ color: "#4f6478", font: "400 15px 'Figtree',sans-serif" }}>
                                No exercises yet. Add reviewed exercises from the library on the right.
                            </div>
                        ) : items.map(item => (
                            <div key={item.id} className="ex">
                                {item.exercise.poseKey ? (
                                    <div style={{ width: "60px", height: "50px", borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
                                        <ExerciseViewer csvId={item.exercise.poseKey} poseOverride={item.exercise.poseData ?? undefined} className="" />
                                    </div>
                                ) : (
                                    <div className="thumb"></div>
                                )}
                                <div style={{ flex: "1 1 160px" }}>
                                    <div style={{ font: "600 15px 'Figtree',sans-serif" }}>{item.exercise.name}</div>
                                    <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif" }}>
                                        {item.reps ? `${item.reps} reps` : ""}{item.sets ? ` · ${item.sets} sets` : ""}{item.frequency ? ` · ${item.frequency}` : ""}
                                    </div>
                                </div>
                                <button type="button" onClick={() => handleRemoveItem(item.id)} disabled={removingId === item.id}
                                    style={{ color: "#991b1b", font: "500 13px 'Figtree',sans-serif", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", opacity: removingId === item.id ? 0.5 : 1 }}>
                                    {removingId === item.id ? "…" : "Remove"}
                                </button>
                            </div>
                        ))}

                        {items.length > 0 && (
                            <div className="card" style={{ display: "grid", gap: "12px" }}>
                                <button type="button" className="btn" style={{ minHeight: "40px" }} onClick={handleSendPlan} disabled={sending}>
                                    {sending ? "Sending…" : "Send plan to patient"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Exercise library */}
                    <div className="card" style={{ flex: "1 1 280px", minWidth: 0 }}>
                        <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>Exercise library</h2>
                        <p className="muted" style={{ font: "400 12px 'Figtree',sans-serif", margin: "4px 0 0" }}>Only clinically reviewed exercises shown</p>
                        <input className="in" aria-label="Search exercises" placeholder="Search exercises" value={libQuery} onChange={e => setLibQuery(e.target.value)} style={{ marginTop: "12px" }} />
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
                            {regions.map(r => (
                                <button key={r} type="button" className={`chip${libQuery === r ? " stcur" : ""}`} style={{ cursor: "pointer" }} onClick={() => setLibQuery(libQuery === r ? "" : r)}>{r}</button>
                            ))}
                        </div>
                        <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
                            {filteredLib.slice(0, 10).map(ex => {
                                const isAdding = adding?.ex.id === ex.id;
                                const isPreviewing = previewLibId === ex.id;
                                return (
                                    <div key={ex.id} style={{ border: "1px solid #d9e3ec", borderRadius: "10px", overflow: "hidden" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px" }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ font: "600 14px 'Figtree',sans-serif" }}>{ex.name}</div>
                                                <div className="muted" style={{ font: "400 12px 'Figtree',sans-serif" }}>{ex.region}{ex.joint ? ` · ${ex.joint}` : ""}</div>
                                            </div>
                                            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                                                {ex.poseKey && (
                                                    <button type="button" onClick={() => setPreviewLibId(isPreviewing ? null : ex.id)}
                                                        style={{ font: "500 12px 'Figtree',sans-serif", color: "#4f6478", background: "none", border: "1px solid #d9e3ec", borderRadius: "6px", padding: "3px 8px", cursor: "pointer" }}>
                                                        {isPreviewing ? "Hide" : "3D"}
                                                    </button>
                                                )}
                                                <button type="button" onClick={() => isAdding ? setAdding(null) : openAdd(ex)}
                                                    style={{ color: isAdding ? "#991b1b" : "#0f5a08", font: "700 13px 'Figtree',sans-serif", background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}>
                                                    {isAdding ? "Cancel" : "Add"}
                                                </button>
                                            </div>
                                        </div>
                                        {isPreviewing && ex.poseKey && (
                                            <div style={{ padding: "0 10px 10px" }}>
                                                <ExerciseViewer csvId={ex.poseKey} poseOverride={ex.poseData ?? undefined} />
                                            </div>
                                        )}
                                        {isAdding && adding && (
                                            <div style={{ padding: "0 10px 12px", borderTop: "1px solid #e8f0f7", marginTop: "2px" }}>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                                                    {[
                                                        { label: "Sets", key: "sets" as const, min: 1, max: 20 },
                                                        { label: "Reps", key: "reps" as const, min: 1, max: 100 },
                                                    ].map(({ label, key, min, max }) => (
                                                        <div key={key} style={{ flex: "1 1 60px" }}>
                                                            <label style={{ display: "block", font: "600 11px 'Figtree',sans-serif", marginBottom: "3px", color: "#4f6478" }}>{label}</label>
                                                            <input type="number" min={min} max={max} className="in" value={adding[key]}
                                                                onChange={e => setAdding(a => a ? { ...a, [key]: Number(e.target.value) } : a)}
                                                                style={{ padding: "6px 8px" }} />
                                                        </div>
                                                    ))}
                                                    <div style={{ flex: "1 1 80px" }}>
                                                        <label style={{ display: "block", font: "600 11px 'Figtree',sans-serif", marginBottom: "3px", color: "#4f6478" }}>Frequency</label>
                                                        <select className="in" value={adding.frequency}
                                                            onChange={e => setAdding(a => a ? { ...a, frequency: e.target.value } : a)}
                                                            style={{ padding: "6px 8px" }}>
                                                            {["Daily", "Twice daily", "Every other day", "3×/week", "2×/week", "Weekly"].map(f => (
                                                                <option key={f}>{f}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <input className="in" placeholder="Notes (optional)" value={adding.notes}
                                                    onChange={e => setAdding(a => a ? { ...a, notes: e.target.value } : a)}
                                                    style={{ marginTop: "8px" }} />
                                                {addErr && <p style={{ font: "400 12px 'Figtree',sans-serif", color: "#b91c1c", margin: "4px 0 0" }}>{addErr}</p>}
                                                <button type="button" className="btn" style={{ marginTop: "10px", width: "100%", minHeight: "36px" }} onClick={handleAddItem}>
                                                    Confirm add
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {filteredLib.length === 0 && (
                                <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif" }}>No reviewed exercises found.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ── Small helper component ─────────────────────────────────────────────────

function Detail({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
    return (
        <div style={wide ? { gridColumn: "1 / -1" } : {}}>
            <div style={{ font: "600 11px 'Figtree',sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", color: "#4f6478", marginBottom: "3px" }}>{label}</div>
            <div style={{ font: "400 14px 'Figtree',sans-serif", color: "#022449" }}>{value}</div>
        </div>
    );
}
