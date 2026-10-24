"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ExerciseItem = {
    id: string; sets: number | null; reps: number | null; frequency: string;
    exercise: { id: string; name: string; region: string };
};
type Program = { id: string; startsAt: string; items: ExerciseItem[]; };
type PracticeTask = { id: string; title: string; schedule: string; logs: { date: string; completed: boolean }[]; };
type Goal = { id: string; title: string; status: string; progress: number; tasks: PracticeTask[]; };
type GoalPlan = { id: string; title: string; goals: Goal[]; };

export default function PlanPage() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [goalPlan, setGoalPlan] = useState<GoalPlan | null>(null);
    const [activeEx, setActiveEx] = useState<ExerciseItem | null>(null);
    const [feeling, setFeeling] = useState<string | null>(null);
    const [tab, setTab] = useState<"exercises" | "goals">("exercises");

    useEffect(() => {
        fetch("/api/proxy/exercise-programs/me").then(r => r.ok ? r.json() : null)
            .then(d => { if (d) { setPrograms(Array.isArray(d) ? d : [d]); } }).catch(() => {});
        fetch("/api/proxy/goal-plans/me").then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setGoalPlan(Array.isArray(d) ? d[0] ?? null : d); }).catch(() => {});
    }, []);

    const prog = programs[0] ?? null;
    const items = prog?.items ?? [];
    const current = activeEx ?? items[0] ?? null;

    const goals = goalPlan?.goals ?? [];
    const hasGoals = goals.length > 0;
    const hasExercises = items.length > 0;

    /* If there are goal plans but no exercises, show goals by default */
    const showTab = hasExercises || hasGoals;

    const todayStr = new Date().toISOString().slice(0, 10);

    return (
        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <h1 style={{ font: "700 26px 'Figtree',sans-serif", margin: 0 }}>
                {tab === "exercises" ? "Your exercises" : "Your goals"}
            </h1>
            {prog && (
                <div className="muted" style={{ font: "400 15px 'Figtree',sans-serif", marginTop: "-8px" }}>
                    {tab === "exercises" ? `Week 1` : goalPlan?.title ?? "Current plan"}
                </div>
            )}

            {/* Tab toggle if both types exist */}
            {hasExercises && hasGoals && (
                <div style={{ display: "flex", gap: "8px" }}>
                    <button type="button" className={`slot${tab === "exercises" ? " on" : ""}`} onClick={() => setTab("exercises")}>Exercises</button>
                    <button type="button" className={`slot${tab === "goals" ? " on" : ""}`} onClick={() => setTab("goals")}>Goals</button>
                </div>
            )}

            {/* ── Exercises tab ───────────────────────────────────────── */}
            {(tab === "exercises" || !hasGoals) && (
                <>
                    {!hasExercises ? (
                        <div className="card" style={{ color: "#4f6663", font: "400 15px/1.5 'Figtree',sans-serif" }}>
                            No exercise plan yet. Your specialist will add exercises after your first session.
                        </div>
                    ) : (
                        <>
                            {/* Active exercise card */}
                            {current && (
                                <div className="card">
                                    <div style={{ height: "130px", borderRadius: "12px", background: "#dbe9e6", display: "flex", alignItems: "center", justifyContent: "center", font: "500 14px 'Figtree',sans-serif", color: "#4f6663" }}>
                                        Exercise video
                                    </div>
                                    <h2 style={{ font: "700 18px 'Figtree',sans-serif", marginTop: "12px" }}>{current.exercise.name}</h2>
                                    <div className="muted" style={{ font: "400 15px 'Figtree',sans-serif", marginTop: "2px" }}>
                                        {current.reps ? `${current.reps} reps` : ""}{current.sets ? ` · ${current.sets} sets` : ""}{current.frequency ? ` · ${current.frequency}` : ""}
                                    </div>
                                    <div style={{ font: "600 13px 'Figtree',sans-serif", marginTop: "14px" }}>How did it feel?</div>
                                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                                        {["Easy", "Okay", "Painful"].map(f => (
                                            <button key={f} type="button" className={`slot${feeling === f ? " on" : ""}`} onClick={() => setFeeling(f)}>{f}</button>
                                        ))}
                                    </div>
                                    <button type="button" className="btn" style={{ marginTop: "14px", width: "100%", display: "flex" }}>Mark as done</button>
                                </div>
                            )}

                            {/* Remaining items */}
                            {items.slice(1).map(item => (
                                <button key={item.id} type="button" className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", textAlign: "left", cursor: "pointer" }} onClick={() => setActiveEx(item)}>
                                    <span style={{ font: "600 16px 'Figtree',sans-serif" }}>{item.exercise.name}</span>
                                    <span className="muted">{item.sets && item.reps ? `${item.sets} x ${item.reps}` : item.frequency}</span>
                                </button>
                            ))}

                            {/* Warning card */}
                            <div className="card" style={{ font: "400 14px/1.4 'Figtree',sans-serif", background: "#fdf1d8", borderColor: "#ecd49b", color: "#5f3f00" }}>
                                Sharp pain, new numbness or swelling? Stop and message your specialist.
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ── Goals tab ───────────────────────────────────────────── */}
            {(tab === "goals" || !hasExercises) && (
                <>
                    {!hasGoals ? (
                        <div className="card" style={{ color: "#4f6663", font: "400 15px/1.5 'Figtree',sans-serif" }}>
                            No goal plan yet. Your specialist will add goals after your first session.
                        </div>
                    ) : (
                        <>
                            {goals.map(goal => (
                                <div key={goal.id} className="card">
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <h2 style={{ font: "700 17px 'Figtree',sans-serif", margin: 0 }}>{goal.title}</h2>
                                        <span className="chip-sm">On track</span>
                                    </div>
                                    <div className="bar" style={{ marginTop: "12px" }}>
                                        <div style={{ width: `${goal.progress ?? 0}%`, height: "8px", borderRadius: "99px", background: "#1b766e" }}></div>
                                    </div>
                                    <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif", marginTop: "6px" }}>
                                        {goal.tasks?.filter(t => t.logs?.some(l => l.date === todayStr && l.completed)).length ?? 0} of {goal.tasks?.length ?? 0} tasks done today
                                    </div>
                                </div>
                            ))}

                            {(goals[0]?.tasks?.length ?? 0) > 0 && (
                                <div className="card">
                                    <h2 style={{ font: "700 17px 'Figtree',sans-serif", margin: 0 }}>{"This week's practice"}</h2>
                                    <div style={{ display: "grid", gap: "12px", marginTop: "12px", font: "500 15px 'Figtree',sans-serif" }}>
                                        {(goals[0]?.tasks ?? []).map(task => {
                                            const done = task.logs?.some(l => l.date === todayStr && l.completed);
                                            return (
                                                <div key={task.id} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                    <span style={{ width: "22px", height: "22px", borderRadius: "6px", flexShrink: 0, background: done ? "#1b766e" : "transparent", border: done ? "none" : "2px solid #b9c9c5" }}></span>
                                                    {task.title}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <button type="button" className="btn" style={{ marginTop: "14px", width: "100%", display: "flex", background: "#fff", color: "#14544e", border: "1.5px solid #1b766e" }}>
                                        Add a note or recording
                                    </button>
                                </div>
                            )}

                            <div className="card">
                                <h2 style={{ font: "700 17px 'Figtree',sans-serif", margin: 0 }}>Tips for the helper</h2>
                                <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>Wait a few seconds before helping. Praise every try.</p>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
