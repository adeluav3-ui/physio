"use client";

import dynamic from "next/dynamic";
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
    videoUrl: string | null;        // stores 11-char YouTube ID (not a full URL)
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

const CATEGORIES = [
    "General", "Strength", "Flexibility", "Balance", "Cardio",
    "Neurological", "Respiratory", "Post-surgical", "Paediatric", "Geriatric",
    "Speech & Language", "Occupational", "Prosthetics & Orthotics",
];

const BODY_REGIONS = [
    "Upper limbs", "Lower limbs", "Back/Trunk", "Neck", "Face",
    "Full Body", "Shoulder", "Elbow", "Wrist & Hand",
    "Hip", "Knee", "Ankle & Foot", "Core", "Spine",
    "Chest", "Pelvic Floor", "Oral Motor",
];

/** Extract 11-char YouTube video ID from any YouTube URL form, or return as-is if already an ID. */
function extractYouTubeId(input: string): string | null {
    if (!input.trim()) return null;
    // Already a bare 11-char ID
    if (/^[A-Za-z0-9_-]{11}$/.test(input.trim())) return input.trim();
    const m = input.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m?.[1] ?? null;
}

const EMPTY_FORM = {
    name: "", category: "General", region: "Upper limbs",
    joint: "", purpose: "", goal: "", conditions: "",
    position: "", howTo: "", dose: "", progression: "",
    precautions: "", equipment: "",
    videoInput: "",   // the user's raw URL or ID — extracted to 11-char ID on save
    instructions: "", cues: "", contraindications: "",
    difficulty: 1, defaultSets: 3, defaultReps: 10, defaultHoldSeconds: 0,
    clinicalReview: false,
};

type FormState = typeof EMPTY_FORM;

export default function AdminLibraryPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState("ALL");
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [err, setErr] = useState("");
    const [previewId, setPreviewId] = useState<string | null>(null);
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
            purpose: ex.purpose ?? "",
            goal: ex.goal ?? "",
            conditions: ex.conditions ?? "",
            position: ex.position ?? "",
            howTo: ex.howTo ?? "",
            dose: ex.dose ?? "",
            progression: ex.progression ?? "",
            precautions: ex.precautions ?? "",
            equipment: ex.equipment ?? "",
            videoInput: ex.videoUrl ?? "",   // stored ID shown back to user
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
            videoUrl: videoId ?? undefined,   // only save valid 11-char IDs
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

    const allCategories = ["ALL", ...CATEGORIES];
    const visible = exercises.filter(ex => {
        if (catFilter !== "ALL" && ex.category !== catFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return ex.name.toLowerCase().includes(q) ||
                ex.region.toLowerCase().includes(q) ||
                (ex.joint?.toLowerCase().includes(q) ?? false) ||
                (ex.goal?.toLowerCase().includes(q) ?? false) ||
                (ex.csvId?.toLowerCase().includes(q) ?? false) ||
                ex.category.toLowerCase().includes(q);
        }
        return true;
    });

    const previewVideoId = extractYouTubeId(form.videoInput);

    const field = (label: string, node: React.ReactNode, hint?: string) => (
        <div>
            <label className="flabel">{label}{hint && <span style={{ fontWeight: 400, color: "#6b7280", marginLeft: "6px" }}>— {hint}</span>}</label>
            {node}
        </div>
    );

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <h1 style={{ font: "700 28px 'Figtree',sans-serif", margin: 0 }}>Exercise library</h1>
                <button type="button" className="btn" onClick={openCreate}>+ Add exercise</button>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: "8px", marginTop: "18px", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", flex: 1 }}>
                    {allCategories.slice(0, 8).map(c => (
                        <button key={c} type="button" onClick={() => setCatFilter(c)} style={{
                            padding: "5px 12px", borderRadius: "16px", border: "1.5px solid",
                            borderColor: catFilter === c ? "#1b7d0e" : "#d9e3ec",
                            background: catFilter === c ? "#1b7d0e" : "#fff",
                            color: catFilter === c ? "#fff" : "#4f6478",
                            font: "500 12px 'Figtree',sans-serif", cursor: "pointer",
                        }}>
                            {c === "ALL" ? `All (${exercises.length})` : c}
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
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "16px" }}>
                        {field("Exercise name *", <input className="in" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Wall slides" />)}
                        {field("Category", <select className="in" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>)}
                        {field("Body region", <select className="in" value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}>{BODY_REGIONS.map(r => <option key={r}>{r}</option>)}</select>)}
                        {field("Joint / sub-region", <input className="in" value={form.joint} onChange={e => setForm(f => ({ ...f, joint: e.target.value }))} placeholder="e.g. Shoulder, Knee" />)}
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
                            <div style={{ marginTop: "6px", font: "400 12px 'Figtree',sans-serif", color: "#e53e3e" }}>
                                Paste a valid YouTube link or 11-character video ID.
                            </div>
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
                        {field("Purpose", <input className="in" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="Management or Diagnosis" />)}
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

            {/* Exercise list */}
            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {loading ? (
                    <div className="card" style={{ padding: "40px", textAlign: "center", color: "#4f6478", font: "400 14px 'Figtree',sans-serif" }}>
                        Loading exercises…
                    </div>
                ) : visible.length === 0 ? (
                    <div className="card" style={{ padding: "40px", textAlign: "center", color: "#4f6478", font: "400 14px 'Figtree',sans-serif" }}>
                        {exercises.length === 0 ? "No exercises yet. Add your first one above." : "No exercises match your filters."}
                    </div>
                ) : visible.map(ex => {
                    const vid = ex.videoUrl && /^[A-Za-z0-9_-]{11}$/.test(ex.videoUrl) ? ex.videoUrl : null;
                    const isAnimated = !!ex.poseKey;
                    const isPreviewOpen = previewId === ex.id;

                    return (
                        <div key={ex.id} className="card" style={{ padding: "16px 20px" }}>
                            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
                                {/* Thumbnail or animation icon */}
                                {vid ? (
                                    <img src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`} alt={ex.name}
                                        style={{ width: "120px", height: "68px", objectFit: "cover", borderRadius: "8px", flexShrink: 0, border: "1px solid #d9e3ec" }} />
                                ) : (
                                    <div style={{ width: "120px", height: "68px", borderRadius: "8px", background: "#eef3f8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #d9e3ec", gap: "4px" }}>
                                        {isAnimated && <span style={{ font: "600 11px 'Figtree',sans-serif", color: "#1b7d0e" }}>3D</span>}
                                        <span style={{ font: "500 10px 'Figtree',sans-serif", color: "#b4c4d3" }}>{isAnimated ? "Animated" : "No video"}</span>
                                    </div>
                                )}

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "baseline", flexWrap: "wrap" }}>
                                        <span style={{ font: "700 16px 'Figtree',sans-serif", color: "#022449" }}>{ex.name}</span>
                                        {ex.csvId && <span className="chip" style={{ fontSize: "10px", fontFamily: "monospace", background: "#f0f4f8" }}>{ex.csvId}</span>}
                                        <span className="chip" style={{ fontSize: "11px" }}>{ex.region}</span>
                                        {ex.joint && <span className="chip" style={{ fontSize: "11px" }}>{ex.joint}</span>}
                                        {ex.clinicalReview && <span className="chip ok" style={{ fontSize: "11px" }}>Reviewed</span>}
                                        {isAnimated && <span className="chip" style={{ fontSize: "11px", background: "#f0fdf4", color: "#166534", borderColor: "#bbf7d0" }}>Animated</span>}
                                    </div>
                                    <div style={{ font: "400 13px 'Figtree',sans-serif", color: "#4f6478", marginTop: "4px" }}>
                                        Difficulty {ex.difficulty} · {ex.defaultSets} sets × {ex.defaultReps} reps
                                        {ex.defaultHoldSeconds > 0 && ` · hold ${ex.defaultHoldSeconds}s`}
                                        {ex.dose && <> · <em>{ex.dose}</em></>}
                                    </div>
                                    {ex.goal && (
                                        <div style={{ font: "400 13px 'Figtree',sans-serif", color: "#4f6478", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "520px" }}>
                                            {ex.goal}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                                    {isAnimated && (
                                        <button type="button" className="btn btn2"
                                            style={{ minHeight: "34px", fontSize: "13px" }}
                                            onClick={() => setPreviewId(isPreviewOpen ? null : ex.id)}>
                                            {isPreviewOpen ? "Hide" : "Preview"}
                                        </button>
                                    )}
                                    <button type="button" className="btn btn2" style={{ minHeight: "34px", fontSize: "13px" }} onClick={() => openEdit(ex)}>Edit</button>
                                    <button type="button" className="btn btn2"
                                        style={{ minHeight: "34px", fontSize: "13px", color: "#991b1b", borderColor: "#fca5a5" }}
                                        onClick={() => handleDelete(ex.id)} disabled={deleting === ex.id}>
                                        {deleting === ex.id ? "…" : "Delete"}
                                    </button>
                                </div>
                            </div>

                            {/* Animation preview panel */}
                            {isPreviewOpen && ex.poseKey && (
                                <div style={{ marginTop: "16px", maxWidth: "520px" }}>
                                    <ExerciseViewer csvId={ex.poseKey} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}
