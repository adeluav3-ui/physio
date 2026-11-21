"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Appointment = {
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
    mode: string;
    type: string;
    patient: { user: { name: string } };
};

const MODE_LABEL: Record<string, string> = {
    VIDEO: "Video",
    CHAT: "Chat",
    HOME: "Home visit",
    ANY: "Any",
};

const TYPE_LABEL: Record<string, string> = {
    ASSESSMENT: "Assessment",
    FOLLOW_UP: "Follow-up",
};

function fmt(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
}
function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

function ApptCard({ a }: { a: Appointment }) {
    const canStart = a.status === "CONFIRMED" || a.status === "IN_PROGRESS";
    return (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 20px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: "600 15px 'Figtree',sans-serif" }}>{a.patient.user.name}</div>
                <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif", marginTop: "2px" }}>
                    {fmt(a.startsAt)} · {fmtTime(a.startsAt)}–{fmtTime(a.endsAt)}
                </div>
                <div className="muted" style={{ font: "400 12px 'Figtree',sans-serif", marginTop: "1px" }}>
                    {TYPE_LABEL[a.type] ?? a.type} · {MODE_LABEL[a.mode] ?? a.mode}
                </div>
            </div>
            {canStart && (
                <Link href={`/pro/session/${a.id}`} className="btn" style={{ flexShrink: 0, font: "600 13px 'Figtree',sans-serif", padding: "8px 14px" }}>
                    Open
                </Link>
            )}
        </div>
    );
}

function Section({ title, items, empty }: { title: string; items: Appointment[]; empty?: string }) {
    return (
        <div style={{ marginBottom: "24px" }}>
            <div style={{ font: "600 13px 'Figtree',sans-serif", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "10px" }}>
                {title} <span style={{ font: "500 12px 'Figtree',sans-serif", letterSpacing: 0 }}>({items.length})</span>
            </div>
            {items.length === 0 ? (
                <div className="card" style={{ padding: "14px 20px" }}>
                    <span className="muted" style={{ font: "400 14px 'Figtree',sans-serif" }}>{empty ?? "None"}</span>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {items.map(a => <ApptCard key={a.id} a={a} />)}
                </div>
            )}
        </div>
    );
}

export default function PhysioAppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/proxy/booking/appointments")
            .then(r => r.ok ? r.json() : [])
            .then(setAppointments)
            .catch(() => setAppointments([]))
            .finally(() => setLoading(false));
    }, []);

    const now = new Date();
    const todayKey = now.toDateString();

    const today = appointments.filter(a =>
        (a.status === "CONFIRMED" || a.status === "IN_PROGRESS") &&
        new Date(a.startsAt).toDateString() === todayKey
    ).sort((a, b) => a.startsAt.localeCompare(b.startsAt));

    const upcoming = appointments.filter(a =>
        a.status === "CONFIRMED" &&
        new Date(a.startsAt).toDateString() !== todayKey &&
        new Date(a.startsAt) > now
    ).sort((a, b) => a.startsAt.localeCompare(b.startsAt));

    const past = appointments.filter(a =>
        a.status === "COMPLETED" || a.status === "REFUNDED" || a.status === "NO_SHOW"
    ).sort((a, b) => b.startsAt.localeCompare(a.startsAt));

    const cancelled = appointments.filter(a => a.status === "CANCELLED")
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

    return (
        <div>
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ font: "700 24px 'Figtree',sans-serif", margin: 0 }}>Schedule</h1>
                <p className="muted" style={{ font: "400 14px 'Figtree',sans-serif", marginTop: "4px" }}>
                    {appointments.filter(a => a.status === "CONFIRMED" || a.status === "IN_PROGRESS").length} upcoming appointment{appointments.filter(a => a.status === "CONFIRMED" || a.status === "IN_PROGRESS").length !== 1 ? "s" : ""}
                </p>
            </div>

            {loading ? (
                <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif", padding: "20px 0" }}>Loading…</div>
            ) : (
                <>
                    <Section title="Today" items={today} empty="No sessions today." />
                    <Section title="Upcoming" items={upcoming} empty="No upcoming appointments." />
                    <Section title="Past" items={past} empty="No past appointments yet." />
                    <Section title="Cancelled" items={cancelled} />
                </>
            )}
        </div>
    );
}
