"use client";

import { useEffect, useRef, useState } from "react";

type Exercise = {
    id: string;
    name: string;
    category: string;
    region: string;
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

const CATEGORIES = [
    "General", "Strength", "Flexibility", "Balance", "Cardio",
    "Neurological", "Respiratory", "Post-surgical", "Paediatric", "Geriatric",
    "Speech & Language", "Occupational", "Prosthetics & Orthotics",
];

const BODY_REGIONS = [
    "Full Body", "Upper Limb", "Shoulder", "Elbow", "Wrist & Hand",
    "Lower Limb", "Hip", "Knee", "Ankle & Foot", "Core", "Spine", "Neck",
    "Chest", "Pelvic Floor", "Oral Motor",
];

function extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
    return m?.[1] ?? null;
}

const EMPTY_FORM = {
    name: "", category: "General", region: "Full Body",
    videoUrl: "", instructions: "", cues: "", contraindications: "",
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
            videoUrl: ex.videoUrl ?? "",
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

    function cancelForm() {
        setShowForm(false);
        setEditId(null);
        setErr("");
    }

    async function handleSave() {
        if (!form.name.trim()) { setErr("Name is required."); return; }
        if (!form.cues.trim()) { setErr("Cues are required."); return; }
        setSaving(true);
        setErr("");
        const payload = {
            ...form,
            videoUrl: form.videoUrl.trim() || undefined,
            instructions: form.instructions.trim() || undefined,
            contraindications: form.contraindications.trim() || undefined,
        };
        try {
            const url = editId
                ? `/api/proxy/admin/exercises/${editId}`
                : "/api/proxy/admin/exercises";
            const r = await fetch(url, {
                method: editId ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!r.ok) {
                const body = await r.json().catch(() => ({}));
                throw new Error(body.message ?? "Failed to save");
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
            await fetch(`/api/proxy/admin/exercises/${id}`, { method: "DELETE" });
            setExercises(prev => prev.filter(e => e.id !== id));
        } catch { /* empty */ }
        setDeleting(null);
    }

    const allCategories = ["ALL", ...CATEGORIES];
    const visible = exercises.filter(ex => {
        if (catFilter !== "ALL" && ex.category !== catFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return ex.name.toLowerCase().includes(q) || ex.region.toLowerCase().includes(q) || ex.category.toLowerCase().includes(q);
        }
        return true;
    });

    const videoId = extractYouTubeId(form.videoUrl);

    const field = (label: string, node: React.ReactNode) => (
        <div>
            <label className="flabel">{label}</label>
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
                        <button
                            key={c}
                            type="button"
                            onClick={() => setCatFilter(c)}
                            style={{
                                padding: "5px 12px",
                                borderRadius: "16px",
                                border: "1.5px solid",
                                borderColor: catFilter === c ? "#1b7d0e" : "#d9e3ec",
                                background: catFilter === c ? "#1b7d0e" : "#fff",
                                color: catFilter === c ? "#fff" : "#4f6478",
                                font: "500 12px 'Figtree',sans-serif",
                                cursor: "pointer",
                            }}
                        >
                            {c === "ALL" ? `All (${exercises.length})` : c}
                        </button>
                    ))}
                </div>
                <input
                    type="search"
                    placeholder="Search exercises…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="in"
                    style={{ minWidth: "200px", maxWidth: "280px" }}
                />
            </div>

            {/* Form panel */}
            {showForm && (
                <div ref={formRef} className="card" style={{ marginTop: "20px" }}>
                    <h2 style={{ font: "700 20px 'Figtree',sans-serif", margin: "0 0 20px" }}>
                        {editId ? "Edit exercise" : "New exercise"}
                    </h2>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "16px" }}>
                        {field("Exercise name *", (
                            <input className="in" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Seated knee extension" />
                        ))}
                        {field("Category", (
                            <select className="in" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        ))}
                        {field("Body region", (
                            <select className="in" value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}>
                                {BODY_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        ))}
                        {field("Difficulty (1–5)", (
                            <select className="in" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: Number(e.target.value) }))}>
                                {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>{d} — {["Very easy", "Easy", "Moderate", "Hard", "Very hard"][d - 1]}</option>)}
                            </select>
                        ))}
                        {field("Default sets", (
                            <input type="number" className="in" min={1} max={20} value={form.defaultSets}
                                onChange={e => setForm(f => ({ ...f, defaultSets: Number(e.target.value) }))} />
                        ))}
                        {field("Default reps", (
                            <input type="number" className="in" min={1} max={100} value={form.defaultReps}
                                onChange={e => setForm(f => ({ ...f, defaultReps: Number(e.target.value) }))} />
                        ))}
                        {field("Default hold (seconds)", (
                            <input type="number" className="in" min={0} max={300} value={form.defaultHoldSeconds}
                                onChange={e => setForm(f => ({ ...f, defaultHoldSeconds: Number(e.target.value) }))} />
                        ))}
                    </div>

                    {/* YouTube URL + live embed preview */}
                    <div style={{ marginTop: "16px" }}>
                        <label className="flabel">YouTube video URL (optional)</label>
                        <input
                            className="in"
                            placeholder="https://www.youtube.com/watch?v=… or https://youtu.be/…"
                            value={form.videoUrl}
                            onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                        />
                        {videoId && (
                            <div style={{ marginTop: "12px", borderRadius: "12px", overflow: "hidden", border: "1px solid #d9e3ec", aspectRatio: "16/9", maxWidth: "480px" }}>
                                <iframe
                                    src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                                    title="Exercise video preview"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                                />
                            </div>
                        )}
                        {form.videoUrl && !videoId && (
                            <div style={{ marginTop: "6px", font: "400 12px 'Figtree',sans-serif", color: "#e53e3e" }}>
                                Paste a valid YouTube link to see the preview.
                            </div>
                        )}
                    </div>

                    {/* Text areas */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "16px", marginTop: "16px" }}>
                        {field("Instructions (shown to patient)", (
                            <textarea className="in" rows={4} value={form.instructions}
                                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                                placeholder="Step-by-step instructions the patient will see…" />
                        ))}
                        {field("Clinical cues *", (
                            <textarea className="in" rows={4} value={form.cues}
                                onChange={e => setForm(f => ({ ...f, cues: e.target.value }))}
                                placeholder="Cues for the therapist — posture tips, common errors, progression notes…" />
                        ))}
                        {field("Contraindications", (
                            <textarea className="in" rows={3} value={form.contraindications}
                                onChange={e => setForm(f => ({ ...f, contraindications: e.target.value }))}
                                placeholder="Who should not perform this exercise…" />
                        ))}
                    </div>

                    {/* Clinical review toggle */}
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "18px", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.clinicalReview}
                            onChange={e => setForm(f => ({ ...f, clinicalReview: e.target.checked }))}
                            style={{ width: "16px", height: "16px", accentColor: "#1b7d0e" }} />
                        <span style={{ font: "500 14px 'Figtree',sans-serif" }}>
                            Clinically reviewed — safe to display to patients without therapist oversight
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
                        <button type="button" className="btn btn2" onClick={cancelForm} disabled={saving}>
                            Cancel
                        </button>
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
                    const vid = extractYouTubeId(ex.videoUrl ?? "");
                    return (
                        <div key={ex.id} className="card" style={{ display: "flex", gap: "16px", alignItems: "flex-start", padding: "16px 20px", flexWrap: "wrap" }}>
                            {/* Thumbnail */}
                            {vid ? (
                                <img
                                    src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`}
                                    alt={ex.name}
                                    style={{ width: "120px", height: "68px", objectFit: "cover", borderRadius: "8px", flexShrink: 0, border: "1px solid #d9e3ec" }}
                                />
                            ) : (
                                <div style={{ width: "120px", height: "68px", borderRadius: "8px", background: "#eef3f8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #d9e3ec" }}>
                                    <span style={{ font: "500 11px 'Figtree',sans-serif", color: "#b4c4d3" }}>No video</span>
                                </div>
                            )}

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", gap: "8px", alignItems: "baseline", flexWrap: "wrap" }}>
                                    <span style={{ font: "700 16px 'Figtree',sans-serif", color: "#022449" }}>{ex.name}</span>
                                    <span className="chip" style={{ fontSize: "11px" }}>{ex.category}</span>
                                    <span className="chip" style={{ fontSize: "11px" }}>{ex.region}</span>
                                    {ex.clinicalReview && <span className="chip ok" style={{ fontSize: "11px" }}>Reviewed</span>}
                                </div>
                                <div style={{ font: "400 13px 'Figtree',sans-serif", color: "#4f6478", marginTop: "4px" }}>
                                    Difficulty {ex.difficulty} · {ex.defaultSets} sets × {ex.defaultReps} reps
                                    {ex.defaultHoldSeconds > 0 && ` · hold ${ex.defaultHoldSeconds}s`}
                                </div>
                                {ex.cues && (
                                    <div style={{ font: "400 13px 'Figtree',sans-serif", color: "#4f6478", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "480px" }}>
                                        {ex.cues}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                                <button type="button" className="btn btn2" style={{ minHeight: "34px", fontSize: "13px" }}
                                    onClick={() => openEdit(ex)}>
                                    Edit
                                </button>
                                <button type="button" className="btn btn2" style={{ minHeight: "34px", fontSize: "13px", color: "#991b1b", borderColor: "#fca5a5" }}
                                    onClick={() => handleDelete(ex.id)}
                                    disabled={deleting === ex.id}>
                                    {deleting === ex.id ? "…" : "Delete"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
