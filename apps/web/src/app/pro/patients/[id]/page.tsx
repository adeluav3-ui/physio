"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, Chip, EmptyState, ProgressBar, Tabs } from "@physio/ui";

type ExerciseItem = {
    id: string;
    sets: number | null;
    reps: number | null;
    frequency: string;
    exercise: { name: string; region: string };
};

type Program = { id: string; startsAt: string; items: ExerciseItem[] };

type PracticeTask = { id: string; title: string; schedule: string };
type Goal = { id: string; title: string; status: string; progress: number; tasks: PracticeTask[] };
type GoalPlan = { id: string; title: string; status: string; goals: Goal[] };

type Appointment = {
    id: string;
    startsAt: string;
    status: string;
    mode: string;
};

type PatientInfo = { userId?: string; id?: string; dob?: string; sex?: string; location?: string };

const TAB_ITEMS = [
    { key: "timeline", label: "Timeline" },
    { key: "plan", label: "Plan" },
    { key: "referrals", label: "Referrals" },
];

export default function PatientRecordPage() {
    const { id: patientId } = useParams<{ id: string }>();
    const [tab, setTab] = useState("timeline");
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [goalPlans, setGoalPlans] = useState<GoalPlan[]>([]);
    const [patient, setPatient] = useState<PatientInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [apptRes, progRes] = await Promise.all([
                    fetch("/api/proxy/booking/appointments").then((r) => (r.ok ? r.json() : [])),
                    fetch(`/api/proxy/programs/patient/${patientId}`).then((r) => (r.ok ? r.json() : [])),
                ]);
                setAppointments(apptRes ?? []);
                setPrograms(progRes ?? []);
            } catch {
                // Swallow; show empty states
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [patientId]);

    if (loading) {
        return (
            <div className="mx-auto max-w-3xl p-4">
                <p className="text-sm text-text-muted">Loading patient record…</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-text-muted">
                <Link href="/pro" className="hover:underline">Dashboard</Link>
                <span>›</span>
                <span>Patient record</span>
            </div>

            <h1 className="text-2xl font-semibold">Patient record</h1>

            <div className="mt-4">
                <Tabs items={TAB_ITEMS} active={tab} onChange={setTab} />
            </div>

            {tab === "timeline" && (
                <div className="mt-6 flex flex-col gap-3">
                    {appointments.length === 0 ? (
                        <EmptyState title="No appointments yet" description="Sessions will appear here." />
                    ) : (
                        appointments.map((a) => (
                            <Card key={a.id}>
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-medium">
                                            {new Date(a.startsAt).toLocaleDateString(undefined, {
                                                weekday: "short",
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                            {" · "}
                                            {new Date(a.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                        <p className="mt-0.5 text-xs text-text-muted">{a.mode}</p>
                                    </div>
                                    <Chip variant={a.status === "COMPLETED" ? "ok" : a.status === "CANCELLED" ? "danger" : "default"}>
                                        {a.status}
                                    </Chip>
                                </div>
                                <Link href={`/pro/session/${a.id}`} className="mt-2 inline-block text-sm text-primary-600 underline">
                                    Open session
                                </Link>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {tab === "plan" && (
                <div className="mt-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Exercise programmes</h2>
                    </div>
                    {programs.length === 0 ? (
                        <EmptyState
                            title="No programmes"
                            description="Assign exercises to this patient from the exercise library."
                        />
                    ) : (
                        programs.map((prog) => (
                            <Card key={prog.id}>
                                <p className="text-xs uppercase tracking-wide text-text-muted">
                                    Since {new Date(prog.startsAt).toLocaleDateString()}
                                </p>
                                <ul className="mt-2 space-y-1">
                                    {prog.items.map((item) => (
                                        <li key={item.id} className="text-sm">
                                            <span className="font-medium">{item.exercise.name}</span>
                                            {item.sets && ` · ${item.sets} sets`}
                                            {item.reps && ` × ${item.reps}`}
                                            {` · ${item.frequency}`}
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        ))
                    )}

                    <div className="mt-2 flex items-center justify-between">
                        <h2 className="font-semibold">Goal plans</h2>
                        <button
                            type="button"
                            onClick={() => alert("Goal plan creation UI — Phase F")}
                            className="text-sm font-medium text-primary-600 underline"
                        >
                            + New goal plan
                        </button>
                    </div>
                    {goalPlans.length === 0 && (
                        <EmptyState
                            title="No goal plans"
                            description="Create a goal plan to track rehabilitation milestones."
                        />
                    )}
                </div>
            )}

            {tab === "referrals" && (
                <div className="mt-6">
                    <EmptyState
                        title="Referrals"
                        description="Send or receive referrals for this patient. Coming in the next release."
                    />
                </div>
            )}
        </div>
    );
}
