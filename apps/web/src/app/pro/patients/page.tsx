"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Patient = {
    id: string;
    name: string;
    email: string;
    lastSeen: string;
    totalSessions: number;
    nextAppt: string | null;
};

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");

    useEffect(() => {
        fetch("/api/proxy/booking/appointments")
            .then((r) => (r.ok ? r.json() : []))
            .then((appts: Array<{
                id: string;
                startsAt: string;
                status: string;
                patientId: string;
                patient: { user: { name: string; email: string } };
            }>) => {
                // Deduplicate by patientId, pick most recent / next appointment
                const map = new Map<string, Patient>();
                const now = new Date();

                for (const a of appts) {
                    const pid = a.patientId;
                    const existing = map.get(pid);
                    const isUpcoming = new Date(a.startsAt) > now && a.status === "CONFIRMED";
                    const isFuture = new Date(a.startsAt) > now;

                    if (!existing) {
                        map.set(pid, {
                            id: pid,
                            name: a.patient.user.name,
                            email: a.patient.user.email,
                            lastSeen: a.startsAt,
                            totalSessions: 1,
                            nextAppt: isUpcoming ? a.startsAt : null,
                        });
                    } else {
                        existing.totalSessions += 1;
                        if (new Date(a.startsAt) > new Date(existing.lastSeen)) {
                            existing.lastSeen = a.startsAt;
                        }
                        if (isUpcoming && (!existing.nextAppt || new Date(a.startsAt) < new Date(existing.nextAppt))) {
                            existing.nextAppt = a.startsAt;
                        }
                    }
                }

                setPatients(Array.from(map.values()).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)));
            })
            .catch(() => setPatients([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = patients.filter(
        (p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.email.toLowerCase().includes(q.toLowerCase())
    );

    function fmt(iso: string) {
        return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
    }

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
                <div>
                    <h1 style={{ font: "700 24px 'Figtree',sans-serif", margin: 0 }}>Patients</h1>
                    <p className="muted" style={{ font: "400 14px 'Figtree',sans-serif", marginTop: "4px" }}>
                        {patients.length} patient{patients.length !== 1 ? "s" : ""} seen
                    </p>
                </div>
            </div>

            <input
                type="search"
                placeholder="Search by name or email…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="in"
                style={{ marginBottom: "16px", maxWidth: "400px" }}
            />

            {loading && (
                <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif", padding: "20px 0" }}>Loading…</div>
            )}

            {!loading && filtered.length === 0 && (
                <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
                    <p className="muted" style={{ font: "400 15px 'Figtree',sans-serif" }}>
                        {q ? "No patients match that search." : "No patients yet — appointments will appear here."}
                    </p>
                </div>
            )}

            {!loading && filtered.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    {filtered.map((p, i) => (
                        <Link
                            key={p.id}
                            href={`/pro/patients/${p.id}`}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "14px",
                                padding: "14px 20px",
                                borderTop: i === 0 ? "none" : "1px solid var(--line)",
                                textDecoration: "none",
                                color: "inherit",
                            }}
                        >
                            <div style={{
                                width: "40px", height: "40px", borderRadius: "50%",
                                background: "var(--blue-tint)", flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                font: "700 15px 'Figtree',sans-serif", color: "var(--blue-dark)",
                            }}>
                                {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ font: "600 15px 'Figtree',sans-serif" }}>{p.name}</div>
                                <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif", marginTop: "1px" }}>
                                    {p.totalSessions} session{p.totalSessions !== 1 ? "s" : ""} · Last seen {fmt(p.lastSeen)}
                                </div>
                            </div>
                            {p.nextAppt && (
                                <span className="chip ok" style={{ flexShrink: 0, font: "500 12px 'Figtree',sans-serif" }}>
                                    Next: {fmt(p.nextAppt)}
                                </span>
                            )}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden style={{ flexShrink: 0, color: "var(--muted)" }}>
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
