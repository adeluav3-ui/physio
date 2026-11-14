"use client";

import { useEffect, useState } from "react";

type ExerciseItem = {
    id: string;
    sets: number;
    reps: number;
    holdSeconds: number;
    frequency: string;
    notes: string | null;
    exercise: { id: string; name: string; region: string; cues: string };
    todayLog: { completed: boolean; notes: string | null } | null;
};

type TodayData = {
    programId: string;
    items: ExerciseItem[];
    streak: number;
    doneToday: number;
    total: number;
};

type Feel = "easy" | "okay" | "painful";

const NAV = "#022449";
const GREEN = "#1b7d0e";
const MUTED = "#4f6478";
const BORDER = "#d9e3ec";

export default function PatientPlanPage() {
    const [data, setData] = useState<TodayData | null>(null);
    const [loading, setLoading] = useState(true);
    const [logging, setLogging] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/proxy/programs/today")
            .then((r) => (r.ok ? r.json() : null))
            .then((d: TodayData | null) => {
                setData(d);
                // Auto-expand the first incomplete exercise
                if (d?.items) {
                    const first = d.items.find((i) => !i.todayLog?.completed);
                    if (first) setExpanded(first.id);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    async function markDone(itemId: string, feel: Feel) {
        setLogging(itemId);
        try {
            await fetch(`/api/proxy/programs/items/${itemId}/log`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ completed: true, feel }),
            });
            setData((prev) => {
                if (!prev) return prev;
                const items = prev.items.map((i) =>
                    i.id === itemId ? { ...i, todayLog: { completed: true, notes: feel } } : i,
                );
                const doneToday = items.filter((i) => i.todayLog?.completed).length;
                return { ...prev, items, doneToday };
            });
            // Auto-expand next incomplete
            setExpanded((cur) => {
                const remaining = data?.items.filter((i) => !i.todayLog?.completed && i.id !== itemId) ?? [];
                return cur === itemId ? (remaining[0]?.id ?? null) : cur;
            });
        } finally {
            setLogging(null);
        }
    }

    if (loading) {
        return (
            <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', system-ui, sans-serif" }}>
                <p style={{ fontSize: 14, color: MUTED }}>Loading your plan…</p>
            </div>
        );
    }

    if (!data || data.items.length === 0) {
        return (
            <div style={{ padding: "24px 20px", fontFamily: "'Figtree', system-ui, sans-serif", color: NAV, maxWidth: 480, margin: "0 auto" }}>
                <h1 style={{ font: "700 26px 'Figtree', sans-serif", margin: 0 }}>Your exercises</h1>
                <div style={{ marginTop: 24, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, textAlign: "center" }}>
                    <p style={{ font: "500 15px 'Figtree', sans-serif", color: MUTED }}>No exercise plan yet.</p>
                    <p style={{ font: "400 14px 'Figtree', sans-serif", color: MUTED, marginTop: 4 }}>
                        Your professional will add exercises after your first session.
                    </p>
                </div>
            </div>
        );
    }

    const pct = data.total > 0 ? Math.round((data.doneToday / data.total) * 100) : 0;

    return (
        <div style={{ padding: "24px 20px", fontFamily: "'Figtree', system-ui, sans-serif", color: NAV, maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
            <h1 style={{ font: "700 26px 'Figtree', sans-serif", margin: 0 }}>Your exercises</h1>
            <p style={{ font: "400 15px 'Figtree', sans-serif", color: MUTED, margin: 0, marginTop: -8 }}>
                {data.doneToday} of {data.total} done today
            </p>

            {/* Progress bar */}
            <div style={{ height: 8, borderRadius: 99, background: "#d9e3ec" }}>
                <div style={{ width: `${pct}%`, height: 8, borderRadius: 99, background: GREEN, transition: "width 0.4s" }} />
            </div>

            {/* Exercise cards */}
            {data.items.map((item) => {
                const done = item.todayLog?.completed ?? false;
                const isOpen = expanded === item.id;

                return (
                    <div
                        key={item.id}
                        style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", opacity: done ? 0.7 : 1 }}
                    >
                        {/* Collapsed row */}
                        <button
                            onClick={() => setExpanded(isOpen ? null : item.id)}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                        >
                            <span style={{ font: "600 16px 'Figtree', sans-serif" }}>{item.exercise.name}</span>
                            <span style={{ font: "400 14px 'Figtree', sans-serif", color: done ? GREEN : MUTED, fontWeight: done ? 600 : 400 }}>
                                {done ? "Done" : `${item.sets} × ${item.reps}`}
                            </span>
                        </button>

                        {/* Expanded card */}
                        {isOpen && (
                            <div style={{ padding: "0 16px 16px" }}>
                                {/* Video placeholder */}
                                <div style={{ height: 130, borderRadius: 12, background: "#dbe8f1", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, marginBottom: 12 }}>
                                    <span style={{ font: "500 14px 'Figtree', sans-serif" }}>Exercise video</span>
                                </div>

                                <h2 style={{ font: "700 18px 'Figtree', sans-serif", margin: 0 }}>{item.exercise.name}</h2>
                                <p style={{ font: "400 15px 'Figtree', sans-serif", color: MUTED, margin: "4px 0 14px" }}>
                                    {item.reps} reps · {item.sets} sets{item.frequency ? ` · ${item.frequency}` : ""}
                                </p>

                                {item.exercise.cues && (
                                    <p style={{ font: "400 14px/1.5 'Figtree', sans-serif", color: MUTED, marginBottom: 14 }}>
                                        {item.exercise.cues}
                                    </p>
                                )}

                                {!done && (
                                    <>
                                        <div style={{ font: "600 13px 'Figtree', sans-serif", marginBottom: 8 }}>How did it feel?</div>
                                        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                                            {(["easy", "okay", "painful"] as Feel[]).map((f) => (
                                                <button
                                                    key={f}
                                                    onClick={() => markDone(item.id, f)}
                                                    disabled={logging === item.id}
                                                    style={{
                                                        padding: "11px 14px",
                                                        borderRadius: 10,
                                                        border: `1px solid ${GREEN}`,
                                                        color: "#0f5a08",
                                                        font: "600 14px 'Figtree', sans-serif",
                                                        background: "#fff",
                                                        cursor: logging === item.id ? "not-allowed" : "pointer",
                                                        opacity: logging === item.id ? 0.6 : 1,
                                                    }}
                                                >
                                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => markDone(item.id, "okay")}
                                            disabled={logging === item.id}
                                            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: 50, borderRadius: 12, background: logging === item.id ? "#999" : GREEN, color: "#fff", font: "600 16px 'Figtree', sans-serif", border: 0, cursor: logging === item.id ? "not-allowed" : "pointer" }}
                                        >
                                            {logging === item.id ? "Saving…" : "Mark as done"}
                                        </button>
                                    </>
                                )}

                                {done && (
                                    <div style={{ display: "inline-block", padding: "4px 10px", borderRadius: 99, font: "600 12px 'Figtree', sans-serif", background: "#e3f4e8", color: "#1d5c34" }}>
                                        Completed today
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Safety warning */}
            <div style={{ background: "#fdf1d8", border: "1px solid #ecd49b", borderRadius: 16, padding: 16, font: "400 14px/1.4 'Figtree', sans-serif", color: "#5f3f00" }}>
                Sharp pain, new numbness or swelling? Stop and message your specialist.
            </div>

            {/* Streak */}
            {data.streak > 0 && (
                <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16 }}>
                    <div style={{ font: "500 13px 'Figtree', sans-serif", color: MUTED }}>Streak</div>
                    <div style={{ font: "700 22px 'Figtree', sans-serif", marginTop: 2 }}>{data.streak} day{data.streak === 1 ? "" : "s"} in a row</div>
                </div>
            )}
        </div>
    );
}
