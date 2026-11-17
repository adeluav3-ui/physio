"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const ExerciseViewer = dynamic(() => import("@/components/exercise-viewer"), { ssr: false });

type Exercise = {
    id: string;
    csvId: string | null;
    name: string;
    category: string;
    region: string;
    joint: string | null;
    purpose: string | null;
    goal: string | null;
    conditions: string | null;
    position: string | null;
    howTo: string | null;
    dose: string | null;
    progression: string | null;
    precautions: string | null;
    equipment: string | null;
    videoStatus: string | null;
    poseKey: string | null;
    videoUrl: string | null;
    instructions: string | null;
    cues: string;
    contraindications: string | null;
    difficulty: number;
    defaultSets: number;
    defaultReps: number;
    defaultHoldSeconds: number;
    clinicalReview: boolean;
    createdAt: string;
};

// Region tabs matching the CSV structure
const REGION_TABS = [
    { label: "All", regions: null as null | string[] },
    { label: "Upper Limbs", regions: ["Upper limbs"] },
    { label: "Lower Limbs", regions: ["Lower limbs"] },
    { label: "Back and Neck", regions: ["Back/Trunk", "Neck"] },
    { label: "Face", regions: ["Face"] },
];

// Form dropdown options
const BODY_REGIONS = [
    "Upper limbs", "Lower limbs", "Back/Trunk", "Neck", "Face", "Full Body",
];

const JOINTS_BY_REGION: Record<string, string[]> = {
    "Upper limbs": ["Shoulder", "Elbow", "Wrist and hand"],
    "Lower limbs": ["Hip", "Knee", "Ankle and foot"],
    "Back/Trunk": ["Lower back", "Upper back"],
    "Neck": ["Neck"],
    "Face": ["Facial muscles", "Jaw (TMJ)"],
    "Full Body": [],
};

/** Extract 11-char YouTube video ID from any YouTube URL form, or return as-is if already an ID. */
function extractYouTubeId(input: string): string | null {
    if (!input.trim()) return null;
    if (/^[A-Za-z0-9_-]{11}$/.test(input.trim())) return input.trim();
    const m = input.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m?.[1] ?? null;
}

const EMPTY_FORM = {
    name: "", category: "General", region: "Upper limbs",
    joint: "", purpose: "Management", goal: "", conditions: "",
    position: "", howTo: "", dose: "", progression: "",
    precautions: "", equipment: "",
    videoInput: "",
    instructions: "", cues: "", contraindications: "",
    difficulty: 1, defaultSets: 3, defaultReps: 10, defaultHoldSeconds: 0,
    clinicalReview: false,
};

type FormState = typeof EMPTY_FORM;

/** Group an array by a key function, preserving insertion order of first occurrence. */
function groupBy<T>(arr: T[], key: (item: T) => string): { label: string; items: T[] }[] {
    const map = new Map<string, T[]>();
    for (const item of arr) {
        const k = key(item);
        const bucket = map.get(k);
        if (bucket) bucket.push(item);
        else map.set(k, [item]);
    }
    return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

export default function AdminLibraryPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [regionTab, setRegionTab] = useState("All");
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [err, setErr] = useState("");
    const formRef = useRef<HTMLDivElement>(null);

    async function load() {
        setLoading(true);
        try {
            const r = await fetch("/api/proxy/admin/exercises");
            const data = await r.json();
            setExercises(Array.isArray(data) ? data : []);
        } catch { /* empty */ }
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    function openCreate() {
        setEditId(null);
        setForm(EMPTY_FORM);
        setErr("");
        setShowForm(true);
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }

    function openEdit(ex: Exercise) {
        setEditId(ex.id);
        setForm({
            name: ex.name,
            category: ex.category,
            region: ex.region,
            joint: ex.joint ?? "",
            purpose: ex.purpose ?? "Management",
            goal: ex.goal ?? "",
            conditions: ex.conditions ?? "",
            position: ex.position ?? "",
            howTo: ex.howTo ?? "",
            dose: ex.dose ?? "",
            progression: ex.progression ?? "",
            precautions: ex.precautions ?? "",
            equipment: ex.equipment ?? "",
            videoInput: ex.videoUrl ?? "",
            instructions: ex.instructions ?? "",
            cues: ex.cues,
            contraindications: ex.contraindications ?? "",
            difficulty: ex.difficulty,
            defaultSets: ex.defaultSets,
            defaultReps: ex.defaultReps,
            defaultHoldSeconds: ex.defaultHoldSeconds,
            clinicalReview: ex.clinicalReview,
        });
        setErr("");
        setShowForm(true);
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }

    function cancelForm() { setShowForm(false); setEditId(null); setErr(""); }

    async function handleSave() {
        if (!form.name.trim()) { setErr("Name is required."); return; }
        setSaving(true);
        setErr("");
        const videoId = extractYouTubeId(form.videoInput);
        const payload = {
            name: form.name.trim(),
            category: form.category,
            region: form.region,
            joint: form.joint.trim() || undefined,
            purpose: form.purpose.trim() || undefined,
            goal: form.goal.trim() || undefined,
            conditions: form.conditions.trim() || undefined,
            position: form.position.trim() || undefined,
            howTo: form.howTo.trim() || undefined,
            dose: form.dose.trim() || undefined,
            progression: form.progression.trim() || undefined,
            precautions: form.precautions.trim() || undefined,
            equipment: form.equipment.trim() || undefined,
            videoUrl: videoId ?? undefined,
            instructions: form.instructions.trim() || undefined,
            cues: form.cues.trim(),
            contraindications: form.contraindications.trim() || undefined,
            difficulty: form.difficulty,
            defaultSets: form.defaultSets,
            defaultReps: form.defaultReps,
            defaultHoldSeconds: form.defaultHoldSeconds,
            clinicalReview: form.clinicalReview,
        };
        try {
            const url = editId ? `/api/proxy/admin/exercises/${editId}` : "/api/proxy/admin/exercises";
            const r = await fetch(url, {
                method: editId ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!r.ok) {
                const body = await r.json().catch(() => ({}));
                throw new Error((body as { message?: string }).message ?? "Failed to save");
            }
            await load();
            setShowForm(false);
            setEditId(null);
        } catch (e) {
            setErr((e as Error).message);
        }
        setSaving(false);
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this exercise? This cannot be undone.")) return;
        setDeleting(id);
        try {
            const r = await fetch(`/api/proxy/admin/exercises/${id}`, { method: "DELETE" });
            if (!r.ok) {
                const body = await r.json().catch(() => ({}));
                alert((body as { message?: string }).message ?? "Delete failed");
                setDeleting(null);
                return;
            }
            setExercises(prev => prev.filter(e => e.id !== id));
        } catch { /* empty */ }
        setDeleting(null);
    }

    // ── Filter ──
    const activeTab = REGION_TABS.find(t => t.label === regionTab)!;
    const visible = exercises.filter(ex => {
        if (activeTab.regions && !activeTab.regions.includes(ex.region)) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                ex.name.toLowerCase().includes(q) ||
                ex.region.toLowerCase().includes(q) ||
                (ex.joint?.toLowerCase().includes(q) ?? false) ||
                (ex.goal?.toLowerCase().includes(q) ?? false) ||
                (ex.csvId?.toLowerCase().includes(q) ?? false) ||
                (ex.purpose?.toLowerCase().includes(q) ?? false)
            );
        }
        return true;
    });

    // Sort: Management before Diagnosis, then by name
    const sorted = [...visible].sort((a, b) => {
        const pa = a.purpose === "Diagnosis" ? 1 : 0;
        const pb = b.purpose === "Diagnosis" ? 1 : 0;
        if (pa !== pb) return pa - pb;
        return a.name.localeCompare(b.name);
    });

    // Group by joint for display
    const groups = groupBy(sorted, ex => ex.joint ?? "Other");

    const previewVideoId = extractYouTubeId(form.videoInput);
    const jointOptions = JOINTS_BY_REGION[form.region] ?? [];

    const field = (label: string, node: React.ReactNode, hint?: string) => (
        <div>
            <label className="flabel">{label}{hint && <span style={{ fontWeight: 400, color: "#6b7280", marginLeft: "6px" }}>— {hint}</span>}</label>
            {node}
        </div>
    );

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h1 style={{ font: "700 28px 'Figtree',sans-serif", margin: 0 }}>Exercise library</h1>
                    <p style={{ font: "400 14px 'Figtree',sans-serif", color: "#4f6478", margin: "4px 0 0" }}>
                        {exercises.length} exercises · {exercises.filter(e => e.poseKey).length} animated
                    </p>
                </div>
                <button type="button" className="btn" onClick={openCreate}>+ Add exercise</button>
            </div>

            {/* Region tabs + search */}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", flex: 1 }}>
                    {REGION_TABS.map(t => (
                        <button key={t.label} type="button" onClick={() => setRegionTab(t.label)} style={{
                            padding: "6px 14px", borderRadius: "20px", border: "1.5px solid",
                            borderColor: regionTab === t.label ? "#022449" : "#d9e3ec",
                            background: regionTab === t.label ? "#022449" : "#fff",
                            color: regionTab === t.label ? "#fff" : "#4f6478",
                            font: "500 13px 'Figtree',sans-serif", cursor: "pointer",
                        }}>
                            {t.label}
                        </button>
                    ))}
                </div>
                <input type="search" placeholder="Search exercises…" value={search}
                    onChange={e => setSearch(e.target.value)} className="in"
                    style={{ minWidth: "200px", maxWidth: "280px" }} />
            </div>

            {/* Form panel */}
            {showForm && (
                <div ref={formRef} className="card" style={{ marginTop: "20px" }}>
                    <h2 style={{ font: "700 20px 'Figtree',sans-serif", margin: "0 0 20px" }}>
                        {editId ? "Edit exercise" : "New exercise"}
                    </h2>

                    {/* Core identity */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "16px" }}>
                        {field("Exercise name *", <input className="in" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Wall slides" />)}
                        {field("Body region", (
                            <select className="in" value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value, joint: "" }))}>
                                {BODY_REGIONS.map(r => <option key={r}>{r}</option>)}
                            </select>
                        ))}
                        {field("Joint", (
                            jointOptions.length > 0 ? (
                                <select className="in" value={form.joint} onChange={e => setForm(f => ({ ...f, joint: e.target.value }))}>
                                    <option value="">— select —</option>
                                    {jointOptions.map(j => <option key={j}>{j}</option>)}
                                </select>
                            ) : (
                                <input className="in" value={form.joint} onChange={e => setForm(f => ({ ...f, joint: e.target.value }))} placeholder="e.g. Shoulder" />
                            )
                        ))}
                        {field("Purpose", (
                            <select className="in" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}>
                                <option>Management</option>
                                <option>Diagnosis</option>
                            </select>
                        ))}
                        {field("Difficulty (1–5)", <select className="in" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: Number(e.target.value) }))}>{[1,2,3,4,5].map(d => <option key={d} value={d}>{d} — {["Very easy","Easy","Moderate","Hard","Very hard"][d-1]}</option>)}</select>)}
                        {field("Default sets", <input type="number" className="in" min={1} max={20} value={form.defaultSets} onChange={e => setForm(f => ({ ...f, defaultSets: Number(e.target.value) }))} />)}
                        {field("Default reps", <input type="number" className="in" min={1} max={100} value={form.defaultReps} onChange={e => setForm(f => ({ ...f, defaultReps: Number(e.target.value) }))} />)}
                        {field("Default hold (seconds)", <input type="number" className="in" min={0} max={300} value={form.defaultHoldSeconds} onChange={e => setForm(f => ({ ...f, defaultHoldSeconds: Number(e.target.value) }))} />)}
                    </div>

                    {/* YouTube video */}
                    <div style={{ marginTop: "16px" }}>
                        <label className="flabel">YouTube video URL or ID (optional)</label>
                        <input className="in" placeholder="https://www.youtube.com/watch?v=… or the 11-char ID"
                            value={form.videoInput} onChange={e => setForm(f => ({ ...f, videoInput: e.target.value }))} />
                        {previewVideoId && (
                            <div style={{ marginTop: "12px", borderRadius: "12px", overflow: "hidden", border: "1px solid #d9e3ec", aspectRatio: "16/9", maxWidth: "480px" }}>
                                <iframe src={`https://www.youtube-nocookie.com/embed/${previewVideoId}?rel=0`}
                                    title="Exercise video preview"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
                            </div>
                        )}
                        {form.videoInput && !previewVideoId && (
                            <p style={{ font: "400 12px 'Figtree',sans-serif", color: "#e53e3e", margin: "6px 0 0" }}>
                                Paste a valid YouTube link or 11-character video ID.
                            </p>
                        )}
                    </div>

                    {/* Patient-facing text */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "16px", marginTop: "16px" }}>
                        {field("Goal", <input className="in" value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} placeholder="What the patient is working toward…" />, "shown to patient")}
                        {field("Dose", <input className="in" value={form.dose} onChange={e => setForm(f => ({ ...f, dose: e.target.value }))} placeholder="e.g. 3 × 10, hold 5 s, daily" />, "shown to patient")}
                        {field("Starting position", <textarea className="in" rows={2} value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="Describe where the patient starts…" />, "shown to patient")}
                        {field("How to do it", <textarea className="in" rows={4} value={form.howTo} onChange={e => setForm(f => ({ ...f, howTo: e.target.value }))} placeholder="Step-by-step movement instructions…" />, "shown to patient")}
                        {field("Stop if / precautions", <textarea className="in" rows={2} value={form.precautions} onChange={e => setForm(f => ({ ...f, precautions: e.target.value }))} placeholder="When the patient should stop or take care…" />, "shown to patient")}
                        {field("Equipment", <input className="in" value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} placeholder="e.g. Resistance band, chair" />, "shown to patient")}
                    </div>

                    {/* Clinical fields */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "16px", marginTop: "16px" }}>
                        {field("Instructions (shown to patient)", <textarea className="in" rows={3} value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Supplementary patient instructions…" />)}
                        {field("Clinical cues", <textarea className="in" rows={3} value={form.cues} onChange={e => setForm(f => ({ ...f, cues: e.target.value }))} placeholder="Therapist cues, common errors, posture tips…" />)}
                        {field("Contraindications", <textarea className="in" rows={2} value={form.contraindications} onChange={e => setForm(f => ({ ...f, contraindications: e.target.value }))} placeholder="Who should not perform this exercise…" />)}
                        {field("Conditions / indications", <textarea className="in" rows={2} value={form.conditions} onChange={e => setForm(f => ({ ...f, conditions: e.target.value }))} placeholder="e.g. Frozen shoulder, post-surgery…" />)}
                        {field("Progression", <input className="in" value={form.progression} onChange={e => setForm(f => ({ ...f, progression: e.target.value }))} placeholder="Next-step exercise or modification…" />)}
                    </div>

                    {/* Clinical review toggle */}
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "18px", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.clinicalReview}
                            onChange={e => setForm(f => ({ ...f, clinicalReview: e.target.checked }))}
                            style={{ width: "16px", height: "16px", accentColor: "#1b7d0e" }} />
                        <span style={{ font: "500 14px 'Figtree',sans-serif" }}>
                            Clinically reviewed — safe to prescribe to patients
                        </span>
                    </label>

                    {err && (
                        <div style={{ marginTop: "12px", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", font: "400 13px 'Figtree',sans-serif", color: "#991b1b" }}>
                            {err}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                        <button type="button" className="btn" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving…" : editId ? "Save changes" : "Add exercise"}
                        </button>
                        <button type="button" className="btn btn2" onClick={cancelForm} disabled={saving}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Exercise list — grouped by joint */}
            <div style={{ marginTop: "24px" }}>
                {loading ? (
                    <div className="card" style={{ padding: "40px", textAlign: "center", color: "#4f6478", font: "400 14px 'Figtree',sans-serif" }}>
                        Loading exercises…
                    </div>
                ) : groups.length === 0 ? (
                    <div className="card" style={{ padding: "40px", textAlign: "center", color: "#4f6478", font: "400 14px 'Figtree',sans-serif" }}>
                        {exercises.length === 0 ? "No exercises yet. Add your first one above." : "No exercises match your filters."}
                    </div>
                ) : groups.map(({ label: joint, items }) => (
                    <div key={joint} style={{ marginBottom: "32px" }}>
                        {/* Joint header */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                            <h2 style={{ font: "700 17px 'Figtree',sans-serif", color: "#022449", margin: 0 }}>{joint}</h2>
                            <span style={{ font: "400 13px 'Figtree',sans-serif", color: "#7a93a8" }}>
                                {items.length} exercise{items.length !== 1 ? "s" : ""}
                            </span>
                            <div style={{ flex: 1, height: "1px", background: "#e8f0f7" }} />
                        </div>

                        {/* Card grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                            {items.map(ex => (
                                <ExerciseCard
                                    key={ex.id}
                                    ex={ex}
                                    deleting={deleting}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

// ── Exercise card ──────────────────────────────────────────
function ExerciseCard({
    ex,
    deleting,
    onEdit,
    onDelete,
}: {
    ex: Exercise;
    deleting: string | null;
    onEdit: (ex: Exercise) => void;
    onDelete: (id: string) => void;
}) {
    const isAnimated = !!ex.poseKey;
    const vid = ex.videoUrl && /^[A-Za-z0-9_-]{11}$/.test(ex.videoUrl) ? ex.videoUrl : null;
    const isDiag = ex.purpose === "Diagnosis";

    return (
        <div
            className="card"
            onClick={() => onEdit(ex)}
            style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" }}
        >
            {/* Media — live animation or YouTube thumbnail.
                View-change buttons inside ExerciseViewer call e.stopPropagation()
                so they don't trigger the card's edit handler. */}
            <div style={{ position: "relative" }}>
                {isAnimated ? (
                    <ExerciseViewer csvId={ex.poseKey!} />
                ) : vid ? (
                    <img
                        src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`}
                        alt={ex.name}
                        style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }}
                    />
                ) : (
                    <div style={{ width: "100%", aspectRatio: "4/3", background: "#dfe8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ font: "400 13px 'Figtree',sans-serif", color: "#7a93a8" }}>No animation</span>
                    </div>
                )}

                {/* Purpose badge */}
                <span style={{
                    position: "absolute", top: 8, left: 8, zIndex: 10,
                    padding: "2px 8px", borderRadius: 6,
                    font: "600 11px 'Figtree',sans-serif",
                    background: isDiag ? "#fdf1d8" : "#e8f4fd",
                    color: isDiag ? "#92400e" : "#1565c0",
                    border: `1px solid ${isDiag ? "#fcd34d" : "#bfdbfe"}`,
                    pointerEvents: "none",
                }}>
                    {ex.purpose ?? "—"}
                </span>

                {/* Reviewed badge */}
                {ex.clinicalReview && (
                    <span style={{
                        position: "absolute", top: 8, right: 8, zIndex: 10,
                        padding: "2px 8px", borderRadius: 6,
                        font: "600 11px 'Figtree',sans-serif",
                        background: "#f0fdf4", color: "#166534",
                        border: "1px solid #bbf7d0",
                        pointerEvents: "none",
                    }}>
                        Reviewed
                    </span>
                )}
            </div>

            {/* Info */}
            <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ font: "700 14px 'Figtree',sans-serif", color: "#022449" }}>{ex.name}</span>
                    {ex.csvId && (
                        <span style={{ font: "600 10px 'Fira Code','Courier New',monospace", color: "#7a93a8", background: "#f0f4f8", padding: "1px 5px", borderRadius: 4 }}>
                            {ex.csvId}
                        </span>
                    )}
                </div>

                {ex.goal && (
                    <p style={{ font: "400 12px/1.4 'Figtree',sans-serif", color: "#4f6478", margin: 0,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {ex.goal}
                    </p>
                )}

                {ex.dose && (
                    <p style={{ font: "500 12px 'Figtree',sans-serif", color: "#022449", margin: 0 }}>
                        {ex.dose}
                    </p>
                )}
            </div>

            {/* Actions — stop propagation so these don't trigger the card's edit handler */}
            <div
                style={{ display: "flex", gap: 6, padding: "0 14px 12px", flexWrap: "wrap" }}
                onClick={e => e.stopPropagation()}
            >
                {isAnimated && (
                    <Link
                        href={`/admin/library/${ex.id}/animation`}
                        style={{ font: "500 12px 'Figtree',sans-serif", color: "#1b7d0e", textDecoration: "none",
                            padding: "5px 10px", borderRadius: 7, border: "1px solid #bbf7d0", background: "#f0fdf4" }}
                    >
                        Edit animation
                    </Link>
                )}
                <button type="button"
                    style={{ font: "500 12px 'Figtree',sans-serif", color: "#022449", padding: "5px 10px",
                        borderRadius: 7, border: "1px solid #d9e3ec", background: "#fff", cursor: "pointer" }}
                    onClick={() => onEdit(ex)}
                >
                    Edit
                </button>
                <button type="button"
                    style={{ font: "500 12px 'Figtree',sans-serif", color: "#991b1b", padding: "5px 10px",
                        borderRadius: 7, border: "1px solid #fca5a5", background: "#fff", cursor: "pointer",
                        opacity: deleting === ex.id ? 0.5 : 1 }}
                    onClick={() => onDelete(ex.id)}
                    disabled={deleting === ex.id}
                >
                    {deleting === ex.id ? "…" : "Delete"}
                </button>
            </div>
        </div>
    );
}
