"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { use, useEffect, useRef, useState, useCallback } from "react";

const ExerciseViewer = dynamic(() => import("@/components/exercise-viewer"), { ssr: false });

type Exercise = {
    id: string;
    csvId: string | null;
    name: string;
    poseKey: string | null;
    poseData: unknown;
};

export default function AnimationEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");

    const [json, setJson] = useState("");
    const [jsonError, setJsonError] = useState("");
    const [parsed, setParsed] = useState<unknown>(null);
    const [preview, setPreview] = useState<unknown>(null);

    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");
    const [clearing, setClearing] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        fetch(`/api/proxy/admin/exercises/${id}`)
            .then((r) => r.json())
            .then((data: Exercise) => {
                setExercise(data);
                if (data.poseData) {
                    const formatted = JSON.stringify(data.poseData, null, 2);
                    setJson(formatted);
                    setParsed(data.poseData);
                    setPreview(data.poseData);
                }
            })
            .catch(() => setFetchError("Failed to load exercise"))
            .finally(() => setLoading(false));
    }, [id]);

    const handleJsonChange = useCallback((value: string) => {
        setJson(value);
        setJsonError("");
        setSaveMsg("");

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!value.trim()) {
            setParsed(null);
            setPreview(null);
            return;
        }

        debounceRef.current = setTimeout(() => {
            try {
                const obj = JSON.parse(value);
                if (typeof obj !== "object" || Array.isArray(obj) || obj === null) {
                    setJsonError("Must be a JSON object (not an array or primitive)");
                    setParsed(null);
                    return;
                }
                setParsed(obj);
                setPreview(obj);
            } catch (e) {
                setJsonError((e as SyntaxError).message);
                setParsed(null);
            }
        }, 400);
    }, []);

    async function handleSave() {
        if (!parsed || typeof parsed !== "object") return;
        setSaving(true);
        setSaveMsg("");
        try {
            const r = await fetch(`/api/proxy/admin/exercises/${id}/animation`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed),
            });
            if (!r.ok) {
                const err = await r.json().catch(() => ({}));
                setSaveMsg((err as { message?: string }).message ?? "Save failed");
            } else {
                setSaveMsg("Saved");
                setTimeout(() => setSaveMsg(""), 2500);
            }
        } catch {
            setSaveMsg("Network error");
        } finally {
            setSaving(false);
        }
    }

    async function handleClear() {
        if (!confirm("Remove the animation override? The exercise will fall back to poses.json.")) return;
        setClearing(true);
        setSaveMsg("");
        try {
            const r = await fetch(`/api/proxy/admin/exercises/${id}/animation`, {
                method: "DELETE",
            });
            if (!r.ok) {
                setSaveMsg("Clear failed");
            } else {
                setJson("");
                setParsed(null);
                setPreview(null);
                setSaveMsg("Override cleared");
                setTimeout(() => setSaveMsg(""), 2500);
            }
        } catch {
            setSaveMsg("Network error");
        } finally {
            setClearing(false);
        }
    }

    if (loading) {
        return (
            <div style={pageStyle}>
                <p style={{ color: "#4f6478", fontSize: 14 }}>Loading…</p>
            </div>
        );
    }

    if (fetchError || !exercise) {
        return (
            <div style={pageStyle}>
                <p style={{ color: "#b91c1c", fontSize: 14 }}>{fetchError || "Exercise not found"}</p>
                <Link href="/admin/library" style={backLink}>← Back to library</Link>
            </div>
        );
    }

    const csvId = exercise.csvId ?? exercise.poseKey ?? "";

    return (
        <div style={pageStyle}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <Link href="/admin/library" style={backLink}>← Library</Link>
                <span style={{ color: "#b4c4d3" }}>/</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#022449" }}>{exercise.name}</span>
                {csvId && (
                    <span style={chip}>{csvId}</span>
                )}
                <span style={{ fontSize: 12, color: "#4f6478", marginLeft: "auto" }}>Animation override editor</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
                {/* JSON editor */}
                <div>
                    <label style={labelStyle}>Pose data (JSON)</label>
                    <textarea
                        value={json}
                        onChange={(e) => handleJsonChange(e.target.value)}
                        spellCheck={false}
                        placeholder={`Paste the exercise entry from poses.json here…\n\n{\n  "phases": [...],\n  "skeleton": {...}\n}`}
                        style={{
                            width: "100%",
                            height: 480,
                            fontFamily: "'Fira Code', 'Courier New', monospace",
                            fontSize: 12,
                            lineHeight: 1.6,
                            padding: "10px 12px",
                            border: `1.5px solid ${jsonError ? "#ef4444" : "#d1dbe6"}`,
                            borderRadius: 8,
                            background: "#f8fafc",
                            color: "#022449",
                            resize: "vertical",
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                    {jsonError && (
                        <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{jsonError}</p>
                    )}

                    <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!parsed || saving}
                            style={saveBtn(!parsed || saving)}
                        >
                            {saving ? "Saving…" : "Save override"}
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={clearing}
                            style={clearBtn}
                        >
                            {clearing ? "Clearing…" : "Clear override"}
                        </button>
                        {saveMsg && (
                            <span style={{ fontSize: 13, color: saveMsg === "Saved" || saveMsg === "Override cleared" ? "#1b7d0e" : "#b91c1c" }}>
                                {saveMsg}
                            </span>
                        )}
                    </div>

                    <p style={{ fontSize: 12, color: "#7a93a8", marginTop: 12, lineHeight: 1.5 }}>
                        Paste the exercise object from <code>poses.json</code> (the value at{" "}
                        <code>exercises[&quot;{csvId || "CSV_ID"}&quot;]</code>). The override
                        takes precedence over the bundled file for all users until cleared.
                    </p>
                </div>

                {/* Live preview */}
                <div>
                    <label style={labelStyle}>
                        Live preview{" "}
                        <span style={{ fontWeight: 400, color: "#7a93a8" }}>
                            {preview ? "(override)" : "(from poses.json)"}
                        </span>
                    </label>
                    {csvId ? (
                        <ExerciseViewer
                            csvId={csvId}
                            poseOverride={preview ?? undefined}
                            className="animation-editor-preview"
                        />
                    ) : (
                        <div style={noPreview}>No csvId — cannot preview animation</div>
                    )}
                    {!preview && (
                        <p style={{ fontSize: 12, color: "#7a93a8", marginTop: 8 }}>
                            Showing the existing animation from poses.json. Paste valid JSON on the
                            left to preview your override in real time.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

const pageStyle: React.CSSProperties = {
    padding: "28px 32px",
    maxWidth: 1100,
    margin: "0 auto",
    fontFamily: "'Figtree', sans-serif",
};

const backLink: React.CSSProperties = {
    fontSize: 13,
    color: "#1b7d0e",
    textDecoration: "none",
    fontWeight: 500,
};

const chip: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    background: "#e8f4fd",
    color: "#1565c0",
    padding: "2px 8px",
    borderRadius: 6,
};

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#4f6478",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 8,
};

const noPreview: React.CSSProperties = {
    aspectRatio: "4/3",
    background: "#f0f4f8",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    color: "#7a93a8",
};

const saveBtn = (disabled: boolean): React.CSSProperties => ({
    padding: "7px 18px",
    borderRadius: 8,
    border: "none",
    background: disabled ? "#c8d8e8" : "#1b7d0e",
    color: disabled ? "#7a93a8" : "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
});

const clearBtn: React.CSSProperties = {
    padding: "7px 14px",
    borderRadius: 8,
    border: "1.5px solid #d1dbe6",
    background: "#fff",
    color: "#4f6478",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
};
