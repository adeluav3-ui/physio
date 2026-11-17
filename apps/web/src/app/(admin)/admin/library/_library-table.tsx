"use client";

import { Fragment, useState } from "react";
import { Card } from "@physio/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Exercise = {
    id: string;
    name: string;
    region: string;
    videoUrl: string;
    cues: string;
    difficulty: number;
    clinicalReview: boolean;
    createdAt: string;
    _count: { programItems: number };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Stars({ value }: { value: number }) {
    return (
        <span className="text-sm" aria-label={`${value} out of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={i < value ? "text-amber-400" : "text-neutral-300"}>
                    ★
                </span>
            ))}
        </span>
    );
}

// ---------------------------------------------------------------------------
// Add-exercise inline form
// ---------------------------------------------------------------------------

type AddFormProps = {
    onAdd: (exercise: Exercise) => void;
    onCancel: () => void;
};

function AddExerciseForm({ onAdd, onCancel }: AddFormProps) {
    const [name, setName] = useState("");
    const [region, setRegion] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [cues, setCues] = useState("");
    const [contraindications, setContraindications] = useState("");
    const [difficulty, setDifficulty] = useState(3);
    const [clinicalReview, setClinicalReview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            const res = await fetch("/api/proxy/admin/library", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    region,
                    videoUrl,
                    cues,
                    contraindications: contraindications || undefined,
                    difficulty,
                    clinicalReview,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message ?? "Failed to create exercise");
            }
            const created: Exercise = await res.json();
            onAdd(created);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mt-4 rounded-md border border-border bg-neutral-50 p-4">
            <h2 className="mb-4 text-sm font-semibold">Add exercise</h2>
            {error && (
                <p className="mb-3 rounded bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
            )}
            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-text-muted">
                        Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-text-muted">
                        Region <span className="text-red-500">*</span>
                    </label>
                    <input
                        required
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-xs font-medium text-text-muted">
                        Video URL <span className="text-red-500">*</span>
                    </label>
                    <input
                        required
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-xs font-medium text-text-muted">
                        Cues <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        required
                        rows={2}
                        value={cues}
                        onChange={(e) => setCues(e.target.value)}
                        className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-xs font-medium text-text-muted">Contraindications</label>
                    <textarea
                        rows={2}
                        value={contraindications}
                        onChange={(e) => setContraindications(e.target.value)}
                        className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-text-muted">Difficulty (1–5)</label>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(Number(e.target.value))}
                        className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 self-end pb-1">
                    <input
                        id="add-clinical-review"
                        type="checkbox"
                        checked={clinicalReview}
                        onChange={(e) => setClinicalReview(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary-600"
                    />
                    <label htmlFor="add-clinical-review" className="text-sm">
                        Clinically reviewed
                    </label>
                </div>

                <div className="flex gap-2 sm:col-span-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                        {saving ? "Saving…" : "Add exercise"}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded border border-border px-4 py-1.5 text-sm text-text-muted hover:bg-neutral-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

// ---------------------------------------------------------------------------
// LibraryTable — exported client component
// ---------------------------------------------------------------------------

type LibraryTableProps = {
    initialExercises: Exercise[];
};

export function LibraryTable({ initialExercises }: LibraryTableProps) {
    const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
    const [showAddForm, setShowAddForm] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null);

    const reviewedCount = exercises.filter((e) => e.clinicalReview).length;

    async function handleToggleReview(exercise: Exercise) {
        const next = !exercise.clinicalReview;
        // Optimistic update
        setExercises((prev) =>
            prev.map((e) => (e.id === exercise.id ? { ...e, clinicalReview: next } : e)),
        );
        try {
            const res = await fetch(`/api/proxy/admin/library/${exercise.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clinicalReview: next }),
            });
            if (!res.ok) throw new Error("Failed to update");
        } catch {
            // Revert on failure
            setExercises((prev) =>
                prev.map((e) =>
                    e.id === exercise.id ? { ...e, clinicalReview: exercise.clinicalReview } : e,
                ),
            );
        }
    }

    async function handleDelete(exercise: Exercise) {
        if (!window.confirm(`Delete "${exercise.name}"? This cannot be undone.`)) return;
        setDeleteError(null);
        setDeletingId(exercise.id);
        try {
            const res = await fetch(`/api/proxy/admin/library/${exercise.id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                if (res.status === 400 && body.code === "IN_USE") {
                    setDeleteError({
                        id: exercise.id,
                        message: body.message ?? "Exercise is in use by one or more programs.",
                    });
                    return;
                }
                throw new Error(body.message ?? "Failed to delete");
            }
            setExercises((prev) => prev.filter((e) => e.id !== exercise.id));
        } catch (err) {
            setDeleteError({
                id: exercise.id,
                message: err instanceof Error ? err.message : "Something went wrong",
            });
        } finally {
            setDeletingId(null);
        }
    }

    function handleAdd(exercise: Exercise) {
        setExercises((prev) => [exercise, ...prev]);
        setShowAddForm(false);
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <p className="text-sm text-text-muted">
                    {exercises.length} exercise{exercises.length !== 1 ? "s" : ""} ·{" "}
                    {reviewedCount} clinically reviewed
                </p>
                {!showAddForm && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="rounded bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                    >
                        + Add exercise
                    </button>
                )}
            </div>

            {showAddForm && (
                <AddExerciseForm onAdd={handleAdd} onCancel={() => setShowAddForm(false)} />
            )}

            <Card padding="none" className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-text-muted">
                        <tr>
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Region</th>
                            <th className="px-4 py-2">Difficulty</th>
                            <th className="px-4 py-2">Clinical review</th>
                            <th className="px-4 py-2">In programs</th>
                            <th className="px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exercises.map((ex) => (
                            <Fragment key={ex.id}>
                                <tr className="border-t border-border">
                                    <td className="px-4 py-2 font-medium">{ex.name}</td>
                                    <td className="px-4 py-2 text-xs text-text-muted">
                                        {ex.region}
                                    </td>
                                    <td className="px-4 py-2">
                                        <Stars value={ex.difficulty} />
                                    </td>
                                    <td className="px-4 py-2">
                                        <button
                                            role="switch"
                                            aria-checked={ex.clinicalReview}
                                            onClick={() => handleToggleReview(ex)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                                                ex.clinicalReview
                                                    ? "bg-primary-600"
                                                    : "bg-neutral-300"
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                                    ex.clinicalReview
                                                        ? "translate-x-4"
                                                        : "translate-x-1"
                                                }`}
                                            />
                                        </button>
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        {ex._count.programItems}
                                    </td>
                                    <td className="px-4 py-2">
                                        <button
                                            onClick={() => handleDelete(ex)}
                                            disabled={deletingId === ex.id}
                                            className="text-xs text-red-600 underline hover:text-red-800 disabled:opacity-50"
                                        >
                                            {deletingId === ex.id ? "Deleting…" : "Delete"}
                                        </button>
                                    </td>
                                </tr>
                                {deleteError?.id === ex.id && (
                                    <tr className="border-t border-red-100 bg-red-50">
                                        <td colSpan={6} className="px-4 py-2 text-xs text-red-700">
                                            {deleteError.message}
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                        {exercises.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-8 text-center text-text-muted"
                                >
                                    No exercises in the library yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
