"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const ExerciseViewer = dynamic(() => import("@/components/exercise-viewer"), { ssr: false });

type ExerciseItem = {
    id: string; sets: number | null; reps: number | null; holdSeconds: number | null; frequency: string;
    exercise: { id: string; name: string; region: string; joint: string | null; poseKey: string | null; poseData: unknown };
};
type Program = { id: string; startsAt: string; items: ExerciseItem[] };
type Appointment = { id: string; startsAt: string; status: string; mode: string };
type LibExercise = {
    id: string; name: string; region: string; joint: string | null;
    poseKey: string | null; poseData: unknown; goal: string | null;
    defaultSets: number; defaultReps: number; defaultHoldSeconds: number;
    clinicalReview: boolean; csvId: string | null;
};

type AddingState = {
    ex: LibExercise;
    sets: number;
    reps: number;
    holdSeconds: number;
    frequency: string;
    notes: string;
};

const TABS = ["Timeline", "Notes", "Plan", "Messages", "Documents", "Referrals"];

export default function PatientRecordPage() {
    const { id: patientId } = useParams<{ id: string }>();
    const [tab, setTab] = useState("Plan");
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [library, setLibrary] = useState<LibExercise[]>([]);
    const [libQuery, setLibQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [adding, setAdding] = useState<AddingState | null>(null);
    const [addErr, setAddErr] = useState("");
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [previewLibId, setPreviewLibId] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const [appts, progs, lib] = await Promise.all([
                    fetch("/api/proxy/booking/appointments").then(r => r.ok ? r.json() : []),
                    fetch(`/api/proxy/programs/patient/${patientId}`).then(r => r.ok ? r.json() : []),
                    fetch("/api/proxy/programs/exercises?reviewed=true").then(r => r.ok ? r.json() : []),
                ]);
                setAppointments(appts ?? []);
                setPrograms(progs ?? []);
                setLibrary(lib ?? []);
            } catch { /* empty */ }
            finally { setLoading(false); }
        }
        load();
    }, [patientId]);

    const prog = programs[0] ?? null;
    const items = prog?.items ?? [];

    const filteredLib = library.filter(e =>
        !libQuery ||
        e.name.toLowerCase().includes(libQuery.toLowerCase()) ||
        e.region.toLowerCase().includes(libQuery.toLowerCase()) ||
        (e.joint?.toLowerCase().includes(libQuery.toLowerCase()) ?? false)
    );
    const regions = [...new Set(library.map(e => e.region))].slice(0, 6);

    function openAdd(ex: LibExercise) {
        setAdding({
            ex,
            sets: ex.defaultSets,
            reps: ex.defaultReps,
            holdSeconds: ex.defaultHoldSeconds,
            frequency: "Daily",
            notes: "",
        });
        setAddErr("");
    }

    async function handleAddItem() {
        if (!adding) return;
        setAddErr("");
        try {
            let programId = prog?.id;
            if (!programId) {
                const r = await fetch("/api/proxy/programs", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        patientId,
                        startsAt: new Date().toISOString(),
                        items: [{
                            exerciseId: adding.ex.id,
                            sets: adding.sets,
                            reps: adding.reps,
                            holdSeconds: adding.holdSeconds,
                            frequency: adding.frequency,
                            ...(adding.notes && { notes: adding.notes }),
                        }],
                    }),
                });
                if (!r.ok) {
                    const e = await r.json().catch(() => ({}));
                    setAddErr((e as { message?: string }).message ?? "Failed to create program");
                    return;
                }
                const newProg: Program = await r.json();
                setPrograms([newProg]);
                setAdding(null);
                return;
            }

            const r = await fetch(`/api/proxy/programs/${programId}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    exerciseId: adding.ex.id,
                    sets: adding.sets,
                    reps: adding.reps,
                    holdSeconds: adding.holdSeconds,
                    frequency: adding.frequency,
                    ...(adding.notes && { notes: adding.notes }),
                }),
            });
            if (!r.ok) {
                const e = await r.json().catch(() => ({}));
                setAddErr((e as { message?: string }).message ?? "Failed to add exercise");
                return;
            }
            const newItem: ExerciseItem = await r.json();
            setPrograms(ps => ps.map(p =>
                p.id === programId ? { ...p, items: [...p.items, newItem] } : p
            ));
            setAdding(null);
        } catch {
            setAddErr("Network error");
        }
    }

    async function handleRemoveItem(itemId: string) {
        if (!prog) return;
        setRemovingId(itemId);
        try {
            await fetch(`/api/proxy/programs/${prog.id}/items/${itemId}`, { method: "DELETE" });
            setPrograms(ps => ps.map(p =>
                p.id === prog.id ? { ...p, items: p.items.filter(i => i.id !== itemId) } : p
            ));
        } catch { /* empty */ }
        finally { setRemovingId(null); }
    }

    async function handleSendPlan() {
        if (!prog) return;
        setSending(true);
        try {
            await fetch(`/api/proxy/programs/${prog.id}/send`, { method: "POST" });
            setSent(true);
            setTimeout(() => setSent(false), 3000);
        } catch { /* empty */ }
        finally { setSending(false); }
    }

    if (loading) {
        return (
            <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree',system-ui,sans-serif" }}>
                <div className="muted" style={{ font: "400 15px 'Figtree',sans-serif" }}>Loading patient record…</div>
            </div>
        );
    }

    return (
        <>
            {/* Patient header */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#cfe3ee", flexShrink: 0 }}></div>
                    <div>
                        <h1 style={{ font: "700 26px 'Figtree',sans-serif", margin: 0 }}>Patient record</h1>
                        <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif" }}>
                            {appointments.length} sessions · <Link href="/pro/patients" style={{ color: "#1b7d0e" }}>All patients</Link>
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button type="button" className="btn btn2" style={{ minHeight: "40px" }}>Message</button>
                    <button type="button" className="btn btn2" style={{ minHeight: "40px" }}>Refer</button>
                    {appointments[0] && (
                        <Link href={`/pro/session/${appointments[0].id}`} className="btn" style={{ minHeight: "40px" }}>Start session</Link>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", flexWrap: "wrap", borderBottom: "1px solid #d9e3ec", marginTop: "20px" }}>
                {TABS.map(t => (
                    <button key={t} type="button" className={`rtab${tab === t ? " rtabon" : ""}`} onClick={() => setTab(t)}>{t}</button>
                ))}
            </div>

            {/* Timeline */}
            {tab === "Timeline" && (
                <div style={{ display: "grid", gap: "12px", marginTop: "20px" }}>
                    {appointments.length === 0 ? (
                        <div className="card" style={{ color: "#4f6478", font: "400 15px 'Figtree',sans-serif" }}>No sessions yet.</div>
                    ) : appointments.map(a => (
                        <div key={a.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                            <div>
                                <div style={{ font: "600 15px 'Figtree',sans-serif" }}>
                                    {new Date(a.startsAt).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}
                                    {" · "}
                                    {new Date(a.startsAt).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })}
                                </div>
                                <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif" }}>{a.mode}</div>
                            </div>
                            <span className={`chip${a.status === "CANCELLED" ? " bad" : a.status === "COMPLETED" ? " ok" : ""}`}>
                                {a.status.toLowerCase()}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Plan */}
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
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id)}
                                    disabled={removingId === item.id}
                                    style={{ color: "#991b1b", font: "500 13px 'Figtree',sans-serif", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", opacity: removingId === item.id ? 0.5 : 1 }}
                                >
                                    {removingId === item.id ? "…" : "Remove"}
                                </button>
                            </div>
                        ))}

                        {/* Notes for patient */}
                        {items.length > 0 && (
                            <div className="card" style={{ display: "grid", gap: "12px" }}>
                                <h2 style={{ font: "700 16px 'Figtree',sans-serif", margin: 0 }}>Message to the patient</h2>
                                <input className="in" value={note} onChange={e => setNote(e.target.value)} placeholder="Keep it gentle for the first week…" />
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button
                                        type="button"
                                        className="btn"
                                        style={{ minHeight: "40px" }}
                                        onClick={handleSendPlan}
                                        disabled={sending}
                                    >
                                        {sending ? "Sending…" : "Send plan to patient"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Exercise library */}
                    <div className="card" style={{ flex: "1 1 280px", minWidth: 0 }}>
                        <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>Exercise library</h2>
                        <p className="muted" style={{ font: "400 12px 'Figtree',sans-serif", margin: "4px 0 0" }}>
                            Only clinically reviewed exercises shown
                        </p>
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
                                                <div className="muted" style={{ font: "400 12px 'Figtree',sans-serif" }}>
                                                    {ex.region}{ex.joint ? ` · ${ex.joint}` : ""}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                                                {ex.poseKey && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewLibId(isPreviewing ? null : ex.id)}
                                                        style={{ font: "500 12px 'Figtree',sans-serif", color: "#4f6478", background: "none", border: "1px solid #d9e3ec", borderRadius: "6px", padding: "3px 8px", cursor: "pointer" }}
                                                    >
                                                        {isPreviewing ? "Hide" : "3D"}
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => isAdding ? setAdding(null) : openAdd(ex)}
                                                    style={{ color: isAdding ? "#991b1b" : "#0f5a08", font: "700 13px 'Figtree',sans-serif", background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}
                                                >
                                                    {isAdding ? "Cancel" : "Add"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* 3D preview */}
                                        {isPreviewing && ex.poseKey && (
                                            <div style={{ padding: "0 10px 10px" }}>
                                                <ExerciseViewer csvId={ex.poseKey} poseOverride={ex.poseData ?? undefined} />
                                            </div>
                                        )}

                                        {/* Inline add form */}
                                        {isAdding && adding && (
                                            <div style={{ padding: "0 10px 12px", borderTop: "1px solid #e8f0f7", marginTop: "2px" }}>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                                                    <div style={{ flex: "1 1 60px" }}>
                                                        <label style={{ display: "block", font: "600 11px 'Figtree',sans-serif", marginBottom: "3px", color: "#4f6478" }}>Sets</label>
                                                        <input type="number" min={1} max={20} className="in" value={adding.sets}
                                                            onChange={e => setAdding(a => a ? { ...a, sets: Number(e.target.value) } : a)}
                                                            style={{ padding: "6px 8px" }} />
                                                    </div>
                                                    <div style={{ flex: "1 1 60px" }}>
                                                        <label style={{ display: "block", font: "600 11px 'Figtree',sans-serif", marginBottom: "3px", color: "#4f6478" }}>Reps</label>
                                                        <input type="number" min={1} max={100} className="in" value={adding.reps}
                                                            onChange={e => setAdding(a => a ? { ...a, reps: Number(e.target.value) } : a)}
                                                            style={{ padding: "6px 8px" }} />
                                                    </div>
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
                                                <button
                                                    type="button"
                                                    className="btn"
                                                    style={{ marginTop: "10px", width: "100%", minHeight: "36px" }}
                                                    onClick={handleAddItem}
                                                >
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

            {/* Remaining tabs — placeholder */}
            {(tab === "Notes" || tab === "Messages" || tab === "Documents" || tab === "Referrals") && (
                <div className="card" style={{ marginTop: "20px", color: "#4f6478", font: "400 15px 'Figtree',sans-serif" }}>
                    {tab} — coming soon.
                </div>
            )}
        </>
    );
}
