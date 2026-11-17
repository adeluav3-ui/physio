"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Exercise = { id: string; name: string; region: string; cues: string };

type ProgramItem = {
    id: string;
    sets: number;
    reps: number;
    holdSeconds: number;
    frequency: string;
    notes: string | null;
    exercise: Exercise;
};

type Program = {
    id: string;
    status: string;
    startsAt: string;
    endsAt: string | null;
    dischargeSummary: string | null;
    patient: { user: { id: string; name: string } };
    items: ProgramItem[];
};

type AddForm = {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: number;
    holdSeconds: number;
    frequency: string;
    notes: string;
};

const NAV = "#022449";
const GREEN = "#1b7d0e";
const MUTED = "#4f6478";
const BORDER = "#d9e3ec";
const GROUND = "#f4f8fb";
const BLUE = "#076889";

const FREQ_OPTIONS = ["Daily", "Every other day", "3× / week", "2× / week", "Weekly"];

function statusChip(status: string) {
    if (status === "DISCHARGED") return { label: "Discharged", bg: "#e3f4e8", color: "#1d5c34" };
    if (status === "ACTIVE") return { label: "Active", bg: "#e3f1ff", color: "#1e40af" };
    return { label: status, bg: "#e3f1f6", color: BLUE };
}

export default function ProProgramDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const [program, setProgram] = useState<Program | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add exercise panel state
    const [showAdd, setShowAdd] = useState(false);
    const [exSearch, setExSearch] = useState("");
    const [exResults, setExResults] = useState<Exercise[]>([]);
    const [exLoading, setExLoading] = useState(false);
    const [addForm, setAddForm] = useState<AddForm | null>(null);
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    // Removing state
    const [removingId, setRemovingId] = useState<string | null>(null);

    // Send plan state
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        fetch(`/api/proxy/programs/${params.id}`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((p: Program) => { setProgram(p); setLoading(false); })
            .catch(() => { setError("Could not load program."); setLoading(false); });
    }, [params.id]);

    useEffect(() => { load(); }, [load]);

    // Exercise search
    useEffect(() => {
        if (!showAdd || exSearch.trim().length < 2) { setExResults([]); return; }
        setExLoading(true);
        const q = exSearch.trim();
        fetch(`/api/proxy/programs/exercises?q=${encodeURIComponent(q)}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data: Exercise[]) => { setExResults(data.slice(0, 8)); setExLoading(false); })
            .catch(() => setExLoading(false));
    }, [exSearch, showAdd]);

    function selectExercise(ex: Exercise) {
        setAddForm({ exerciseId: ex.id, exerciseName: ex.name, sets: 3, reps: 10, holdSeconds: 0, frequency: "Daily", notes: "" });
        setExSearch("");
        setExResults([]);
    }

    async function addItem() {
        if (!addForm) return;
        setAdding(true);
        setAddError(null);
        try {
            const res = await fetch(`/api/proxy/programs/${params.id}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    exerciseId: addForm.exerciseId,
                    sets: addForm.sets,
                    reps: addForm.reps,
                    holdSeconds: addForm.holdSeconds || undefined,
                    frequency: addForm.frequency,
                    notes: addForm.notes.trim() || undefined,
                }),
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error((b as { message?: string }).message ?? "Could not add exercise");
            }
            setAddForm(null);
            setShowAdd(false);
            load();
        } catch (e) {
            setAddError((e as Error).message);
        } finally {
            setAdding(false);
        }
    }

    async function removeItem(itemId: string) {
        setRemovingId(itemId);
        try {
            await fetch(`/api/proxy/programs/${params.id}/items/${itemId}`, { method: "DELETE" });
            setProgram((p) => p ? { ...p, items: p.items.filter((i) => i.id !== itemId) } : p);
        } finally {
            setRemovingId(null);
        }
    }

    async function sendPlan() {
        setSending(true);
        try {
            await fetch(`/api/proxy/programs/${params.id}/send`, { method: "POST" });
            setSent(true);
            setTimeout(() => setSent(false), 3000);
        } finally {
            setSending(false);
        }
    }

    if (loading) {
        return (
            <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', system-ui, sans-serif" }}>
                <p style={{ color: MUTED }}>Loading…</p>
            </div>
        );
    }

    if (error || !program) {
        return (
            <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', system-ui, sans-serif" }}>
                <div style={{ textAlign: "center" }}>
                    <p style={{ color: "#b91c1c" }}>{error ?? "Program not found"}</p>
                    <button onClick={() => router.back()} style={{ marginTop: 12, color: BLUE, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Go back</button>
                </div>
            </div>
        );
    }

    const sc = statusChip(program.status);
    const isActive = program.status === "ACTIVE";

    return (
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px", fontFamily: "'Figtree', system-ui, sans-serif", color: NAV }}>

            {/* Back */}
            <div style={{ marginBottom: 20 }}>
                <button onClick={() => router.back()} style={{ background: "none", border: "none", color: BLUE, cursor: "pointer", fontSize: 14, padding: 0 }}>
                    ← Back
                </button>
            </div>

            {/* Header */}
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 20px 16px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>Patient</div>
                        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{program.patient.user.name}</div>
                        <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
                            Started {new Date(program.startsAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                            {program.endsAt ? ` · Ended ${new Date(program.endsAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}` : ""}
                        </div>
                    </div>
                    <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color, flexShrink: 0 }}>
                        {sc.label}
                    </span>
                </div>

                {program.dischargeSummary && (
                    <div style={{ marginTop: 16, padding: "12px 14px", background: GROUND, borderRadius: 10, fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 600, color: NAV }}>Discharge summary: </span>
                        {program.dischargeSummary}
                    </div>
                )}
            </div>

            {/* Exercises */}
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Exercises ({program.items.length})</span>
                    {isActive && (
                        <button
                            onClick={() => { setShowAdd((v) => !v); setAddForm(null); setExSearch(""); setAddError(null); }}
                            style={{ padding: "6px 14px", borderRadius: 8, background: showAdd ? GROUND : GREEN, color: showAdd ? NAV : "#fff", border: showAdd ? `1px solid ${BORDER}` : 0, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                        >
                            {showAdd ? "Cancel" : "+ Add exercise"}
                        </button>
                    )}
                </div>

                {/* Add exercise panel */}
                {showAdd && (
                    <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, background: GROUND }}>
                        {!addForm ? (
                            <>
                                <input
                                    value={exSearch}
                                    onChange={(e) => setExSearch(e.target.value)}
                                    placeholder="Search exercises by name or region…"
                                    style={{ display: "block", width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }}
                                />
                                {exLoading && <p style={{ fontSize: 13, color: MUTED, marginTop: 8 }}>Searching…</p>}
                                {exResults.length > 0 && (
                                    <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 4 }}>
                                        {exResults.map((ex) => (
                                            <li key={ex.id}>
                                                <button
                                                    onClick={() => selectExercise(ex)}
                                                    style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", cursor: "pointer", fontSize: 14 }}
                                                >
                                                    <span style={{ fontWeight: 600 }}>{ex.name}</span>
                                                    <span style={{ color: MUTED, marginLeft: 8, fontSize: 12 }}>{ex.region}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {!exLoading && exSearch.trim().length >= 2 && exResults.length === 0 && (
                                    <p style={{ fontSize: 13, color: MUTED, marginTop: 8 }}>No exercises found.</p>
                                )}
                            </>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{addForm.exerciseName}</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                    {(["sets", "reps", "holdSeconds"] as const).map((field) => (
                                        <label key={field} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase" }}>
                                            {field === "holdSeconds" ? "Hold (s)" : field.charAt(0).toUpperCase() + field.slice(1)}
                                            <input
                                                type="number"
                                                min={0}
                                                value={addForm[field]}
                                                onChange={(e) => setAddForm((f) => f ? { ...f, [field]: Number(e.target.value) } : f)}
                                                style={{ border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 10px", fontSize: 14, fontFamily: "inherit" }}
                                            />
                                        </label>
                                    ))}
                                </div>
                                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase" }}>
                                    Frequency
                                    <select
                                        value={addForm.frequency}
                                        onChange={(e) => setAddForm((f) => f ? { ...f, frequency: e.target.value } : f)}
                                        style={{ border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 10px", fontSize: 14, fontFamily: "inherit" }}
                                    >
                                        {FREQ_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </label>
                                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase" }}>
                                    Notes (optional)
                                    <input
                                        value={addForm.notes}
                                        onChange={(e) => setAddForm((f) => f ? { ...f, notes: e.target.value } : f)}
                                        placeholder="Specific instructions…"
                                        style={{ border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 10px", fontSize: 14, fontFamily: "inherit" }}
                                    />
                                </label>
                                {addError && <p style={{ fontSize: 13, color: "#b91c1c", margin: 0 }}>{addError}</p>}
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        onClick={addItem}
                                        disabled={adding}
                                        style={{ flex: 1, minHeight: 40, borderRadius: 8, background: adding ? "#9db8a0" : GREEN, color: "#fff", border: 0, fontWeight: 600, fontSize: 14, cursor: adding ? "not-allowed" : "pointer" }}
                                    >
                                        {adding ? "Adding…" : "Add to plan"}
                                    </button>
                                    <button
                                        onClick={() => setAddForm(null)}
                                        style={{ minHeight: 40, padding: "0 16px", borderRadius: 8, background: "#fff", color: NAV, border: `1px solid ${BORDER}`, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Items list */}
                {program.items.length === 0 ? (
                    <div style={{ padding: "32px 20px", textAlign: "center", color: MUTED, fontSize: 14 }}>
                        No exercises yet. {isActive && "Add one above."}
                    </div>
                ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {program.items.map((item, idx) => (
                            <li key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 20px", borderTop: idx === 0 ? "none" : `1px solid ${BORDER}` }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.exercise.name}</div>
                                    <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{item.exercise.region}</div>
                                    <div style={{ fontSize: 13, color: NAV, marginTop: 6, display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                                        <span>{item.sets} sets × {item.reps} reps{item.holdSeconds > 0 ? ` · Hold ${item.holdSeconds}s` : ""}</span>
                                        <span style={{ color: MUTED }}>·</span>
                                        <span style={{ color: MUTED }}>{item.frequency}</span>
                                    </div>
                                    {item.notes && <div style={{ fontSize: 12, color: MUTED, marginTop: 4, fontStyle: "italic" }}>{item.notes}</div>}
                                </div>
                                {isActive && (
                                    <button
                                        onClick={() => void removeItem(item.id)}
                                        disabled={removingId === item.id}
                                        style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 6, background: "#fee2e2", color: "#b91c1c", border: "none", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: removingId === item.id ? 0.5 : 1 }}
                                        aria-label="Remove exercise"
                                    >
                                        ×
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Actions */}
            {isActive && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button
                        onClick={sendPlan}
                        disabled={sending || program.items.length === 0}
                        style={{
                            minHeight: 48,
                            borderRadius: 12,
                            background: !sending && program.items.length > 0 ? GREEN : "#9db8a0",
                            color: "#fff",
                            border: 0,
                            fontWeight: 600,
                            fontSize: 15,
                            cursor: !sending && program.items.length > 0 ? "pointer" : "not-allowed",
                            fontFamily: "inherit",
                        }}
                    >
                        {sent ? "Plan sent ✓" : sending ? "Sending…" : "Send plan to patient"}
                    </button>
                    <Link
                        href={`/pro/programs/${params.id}/discharge`}
                        style={{
                            display: "block",
                            minHeight: 48,
                            borderRadius: 12,
                            background: "#fff",
                            color: "#b42318",
                            border: "1px solid #fca5a5",
                            fontWeight: 600,
                            fontSize: 15,
                            textAlign: "center",
                            lineHeight: "48px",
                            textDecoration: "none",
                        }}
                    >
                        Discharge patient
                    </Link>
                </div>
            )}
        </div>
    );
}
