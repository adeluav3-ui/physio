"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type ExerciseItem = {
    id: string; sets: number | null; reps: number | null; frequency: string;
    exercise: { name: string; region: string };
};
type Program = { id: string; startsAt: string; items: ExerciseItem[] };
type Appointment = { id: string; startsAt: string; status: string; mode: string };
type LibExercise = { id: string; name: string; region: string };

const TABS = ["Timeline", "Notes", "Plan", "Messages", "Documents", "Referrals"];

export default function PatientRecordPage() {
    const { id: patientId } = useParams<{ id: string }>();
    const [tab, setTab] = useState("Plan");
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [library, setLibrary] = useState<LibExercise[]>([]);
    const [libQuery, setLibQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [duration, setDuration] = useState("4 weeks");
    const [reminder, setReminder] = useState("8:00 am");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const [appts, progs, lib] = await Promise.all([
                    fetch("/api/proxy/booking/appointments").then(r => r.ok ? r.json() : []),
                    fetch(`/api/proxy/programs/patient/${patientId}`).then(r => r.ok ? r.json() : []),
                    fetch("/api/proxy/exercises").then(r => r.ok ? r.json() : []),
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
        !libQuery || e.name.toLowerCase().includes(libQuery.toLowerCase()) || e.region.toLowerCase().includes(libQuery.toLowerCase())
    );
    const regions = [...new Set(library.map(e => e.region))].slice(0, 6);

    async function saveDraft() {
        setSaving(true);
        await new Promise(r => setTimeout(r, 600));
        setSaving(false); setSaved(true);
        setTimeout(() => setSaved(false), 2000);
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
                            <span className={`chip${saved ? " ok" : ""}`}>{saving ? "Saving…" : saved ? "Saved" : "Draft saved"}</span>
                        </div>

                        {items.length === 0 ? (
                            <div className="card" style={{ color: "#4f6478", font: "400 15px 'Figtree',sans-serif" }}>
                                No exercises yet. Add from the library on the right.
                            </div>
                        ) : items.map(item => (
                            <div key={item.id} className="ex">
                                <div className="thumb"></div>
                                <div style={{ flex: "1 1 160px" }}>
                                    <div style={{ font: "600 15px 'Figtree',sans-serif" }}>{item.exercise.name}</div>
                                    <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif" }}>
                                        {item.reps ? `${item.reps} reps` : ""}{item.sets ? ` · ${item.sets} sets` : ""}{item.frequency ? ` · ${item.frequency}` : ""}
                                    </div>
                                </div>
                                <span className="muted" style={{ font: "500 14px 'Figtree',sans-serif", cursor: "pointer" }}>Edit</span>
                            </div>
                        ))}

                        {/* Schedule + notes */}
                        <div className="card" style={{ display: "grid", gap: "12px" }}>
                            <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>Schedule and notes for the patient</h2>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                                <div style={{ flex: "1 1 160px" }}>
                                    <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Duration</label>
                                    <input className="in" value={duration} onChange={e => setDuration(e.target.value)} placeholder="4 weeks" />
                                </div>
                                <div style={{ flex: "1 1 160px" }}>
                                    <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Reminder time</label>
                                    <input className="in" value={reminder} onChange={e => setReminder(e.target.value)} placeholder="8:00 am" />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Message to the patient</label>
                                <input className="in" value={note} onChange={e => setNote(e.target.value)} placeholder="Keep it gentle for the first week" />
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            <button type="button" className="btn btn2" style={{ minHeight: "40px" }} onClick={saveDraft}>Save draft</button>
                            <button type="button" className="btn" style={{ minHeight: "40px" }}>Send plan to patient</button>
                        </div>
                    </div>

                    {/* Exercise library */}
                    <div className="card" style={{ flex: "1 1 280px", minWidth: 0 }}>
                        <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>Exercise library</h2>
                        <input className="in" aria-label="Search exercises" placeholder="Search exercises" value={libQuery} onChange={e => setLibQuery(e.target.value)} style={{ marginTop: "12px" }} />
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
                            {regions.map(r => (
                                <button key={r} type="button" className={`chip${libQuery === r ? " stcur" : ""}`} style={{ cursor: "pointer" }} onClick={() => setLibQuery(libQuery === r ? "" : r)}>{r}</button>
                            ))}
                        </div>
                        <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
                            {filteredLib.slice(0, 8).map(ex => (
                                <div key={ex.id} className="ex" style={{ padding: "10px" }}>
                                    <div className="thumb" style={{ width: "52px", height: "40px" }}></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ font: "600 14px 'Figtree',sans-serif" }}>{ex.name}</div>
                                        <div className="muted" style={{ font: "400 12px 'Figtree',sans-serif" }}>{ex.region}</div>
                                    </div>
                                    <span style={{ color: "#0f5a08", font: "700 14px 'Figtree',sans-serif", cursor: "pointer" }}>Add</span>
                                </div>
                            ))}
                            {filteredLib.length === 0 && (
                                <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif" }}>No exercises found.</div>
                            )}
                        </div>
                        <p className="muted" style={{ font: "400 13px/1.5 'Figtree',sans-serif", marginTop: "14px" }}>
                            Occupational and speech therapists see a goal bank here instead of exercises.
                        </p>
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
