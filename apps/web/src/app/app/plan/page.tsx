"use client";

import { useEffect, useState } from "react";
import { Card, Chip, EmptyState, ProgressBar, Tabs } from "@physio/ui";

type ExerciseItem = {
    id: string;
    sets: number | null;
    reps: number | null;
    holdSeconds: number | null;
    frequency: string;
    notes: string | null;
    exercise: { id: string; name: string; region: string; cues: string; difficulty: number };
};

type Program = {
    id: string;
    startsAt: string;
    endsAt: string | null;
    items: ExerciseItem[];
};

type TaskLog = { date: string; completed: boolean };

type PracticeTask = {
    id: string;
    title: string;
    schedule: string;
    notes: string | null;
    logs: TaskLog[];
};

type Goal = {
    id: string;
    title: string;
    status: string;
    progress: number;
    notes: string | null;
    tasks: PracticeTask[];
};

type GoalPlan = {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    goals: Goal[];
};

const REGION_LABELS: Record<string, string> = {
    KNEE: "Knee",
    SHOULDER: "Shoulder",
    LOWER_BACK: "Lower back",
    HIP: "Hip",
    ANKLE: "Ankle",
    NECK: "Neck",
    ELBOW: "Elbow",
    WRIST: "Wrist",
    OTHER: "Other",
};

const today = new Date().toISOString().slice(0, 10);

function isCompletedToday(logs: TaskLog[]) {
    return logs.some((l) => l.date.slice(0, 10) === today && l.completed);
}

export default function PatientPlanPage() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [goalPlans, setGoalPlans] = useState<GoalPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"exercises" | "goals">("exercises");
    const [logging, setLogging] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const [sessRes, goalRes] = await Promise.all([
                    fetch("/api/proxy/triage/latest").then((r) => (r.ok ? r.json() : null)),
                    fetch("/api/proxy/goal-plans/mine").then((r) => (r.ok ? r.json() : [])),
                ]);
                // Get patient ID from session for programs endpoint
                const meRes = await fetch("/api/proxy/patients/me");
                if (meRes.ok) {
                    const me = await meRes.json();
                    const progRes = await fetch(`/api/proxy/programs/patient/${me.userId ?? me.id}`);
                    if (progRes.ok) setPrograms(await progRes.json());
                }
                setGoalPlans(goalRes ?? []);
            } catch {
                // Show empty state
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    async function toggleTask(taskId: string, currentlyDone: boolean) {
        setLogging(taskId);
        try {
            await fetch(`/api/proxy/goal-plans/tasks/${taskId}/log`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ completed: !currentlyDone }),
            });
            // Optimistic update
            setGoalPlans((prev) =>
                prev.map((gp) => ({
                    ...gp,
                    goals: gp.goals.map((g) => ({
                        ...g,
                        tasks: g.tasks.map((t) =>
                            t.id === taskId
                                ? {
                                      ...t,
                                      logs: currentlyDone
                                          ? t.logs.filter((l) => l.date.slice(0, 10) !== today)
                                          : [{ date: today, completed: true }, ...t.logs],
                                  }
                                : t,
                        ),
                    })),
                })),
            );
        } finally {
            setLogging(null);
        }
    }

    const TABS = [
        { key: "exercises", label: "Exercises" },
        { key: "goals", label: "Goals" },
    ] as const;

    if (loading) {
        return (
            <div className="mx-auto max-w-2xl p-4">
                <p className="text-sm text-text-muted">Loading your plan…</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl p-4">
            <h1 className="text-2xl font-semibold">My plan</h1>

            <div className="mt-4">
                <Tabs
                    items={TABS.map((t) => ({ key: t.key, label: t.label }))}
                    active={tab}
                    onChange={(k) => setTab(k as typeof tab)}
                />
            </div>

            {tab === "exercises" && (
                <div className="mt-6 flex flex-col gap-4">
                    {programs.length === 0 ? (
                        <EmptyState
                            title="No exercise program yet"
                            description="Your professional will assign exercises after your first session."
                        />
                    ) : (
                        programs.map((prog) => (
                            <Card key={prog.id}>
                                <p className="text-xs uppercase tracking-wide text-text-muted">
                                    Program · since{" "}
                                    {new Date(prog.startsAt).toLocaleDateString(undefined, {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                                <ul className="mt-3 flex flex-col gap-3">
                                    {prog.items.map((item) => (
                                        <li key={item.id} className="border-t border-border pt-3 first:border-0 first:pt-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-medium">{item.exercise.name}</p>
                                                    <div className="mt-0.5 flex flex-wrap gap-1">
                                                        <Chip>{REGION_LABELS[item.exercise.region] ?? item.exercise.region}</Chip>
                                                        {item.sets && <Chip>{item.sets} sets</Chip>}
                                                        {item.reps && <Chip>{item.reps} reps</Chip>}
                                                        {item.holdSeconds && <Chip>{item.holdSeconds}s hold</Chip>}
                                                    </div>
                                                    <p className="mt-1 text-sm text-text-muted">{item.exercise.cues}</p>
                                                    {item.notes && (
                                                        <p className="mt-1 text-xs text-text-muted italic">{item.notes}</p>
                                                    )}
                                                </div>
                                                <span className="shrink-0 text-xs text-text-muted">{item.frequency}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {tab === "goals" && (
                <div className="mt-6 flex flex-col gap-4">
                    {goalPlans.length === 0 ? (
                        <EmptyState
                            title="No goal plans yet"
                            description="Your professional will create a goal plan after your first session."
                        />
                    ) : (
                        goalPlans.map((gp) => (
                            <Card key={gp.id}>
                                <p className="font-semibold">{gp.title}</p>
                                <div className="mt-3 flex flex-col gap-4">
                                    {gp.goals.map((goal) => (
                                        <div key={goal.id}>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-medium">{goal.title}</p>
                                                <Chip
                                                    variant={
                                                        goal.status === "ACHIEVED"
                                                            ? "ok"
                                                            : goal.status === "PAUSED"
                                                            ? "warn"
                                                            : "accent"
                                                    }
                                                >
                                                    {goal.status}
                                                </Chip>
                                            </div>
                                            {goal.progress > 0 && (
                                                <ProgressBar
                                                    className="mt-2"
                                                    value={goal.progress}
                                                    max={100}
                                                    variant={goal.progress === 100 ? "ok" : "accent"}
                                                    label={`${goal.progress}%`}
                                                />
                                            )}
                                            {goal.tasks.length > 0 && (
                                                <ul className="mt-3 flex flex-col gap-2">
                                                    {goal.tasks.map((task) => {
                                                        const done = isCompletedToday(task.logs);
                                                        return (
                                                            <li
                                                                key={task.id}
                                                                className="flex items-center gap-3 rounded-md border border-border p-2"
                                                            >
                                                                <button
                                                                    type="button"
                                                                    disabled={logging === task.id}
                                                                    onClick={() => toggleTask(task.id, done)}
                                                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                                                                        done
                                                                            ? "border-ok-text bg-ok-bg text-ok-text"
                                                                            : "border-border bg-surface"
                                                                    }`}
                                                                    aria-label={done ? "Mark incomplete" : "Mark complete"}
                                                                >
                                                                    {done && (
                                                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                                            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                                        </svg>
                                                                    )}
                                                                </button>
                                                                <div className="min-w-0">
                                                                    <p className={`text-sm ${done ? "line-through text-text-muted" : "text-text"}`}>
                                                                        {task.title}
                                                                    </p>
                                                                    <p className="text-xs text-text-muted">{task.schedule}</p>
                                                                </div>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
