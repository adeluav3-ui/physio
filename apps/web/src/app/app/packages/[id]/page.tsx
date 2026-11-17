"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Session = {
    id: string;
    appointment: { startsAt: string; status: string };
};

type PackageDetail = {
    id: string;
    physio: { user: { name: string } };
    size: number;
    remaining: number;
    expiresAt: string | null;
    status: "ACTIVE" | "EXHAUSTED" | "EXPIRED";
    sessions: Session[];
};

const NAV = "#022449";
const GREEN = "#1b7d0e";
const MUTED = "#4f6478";
const BORDER = "#d9e3ec";

function statusBadge(status: PackageDetail["status"]) {
    const styles: Record<PackageDetail["status"], { background: string; color: string; label: string }> = {
        ACTIVE: { background: "#ecfce8", color: GREEN, label: "Active" },
        EXHAUSTED: { background: "#f1f5f9", color: MUTED, label: "Exhausted" },
        EXPIRED: { background: "#fef2f2", color: "#b91c1c", label: "Expired" },
    };
    const s = styles[status];
    return (
        <span
            style={{
                display: "inline-block",
                padding: "3px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                background: s.background,
                color: s.color,
                letterSpacing: "0.01em",
            }}
        >
            {s.label}
        </span>
    );
}

function sessionStatusLabel(status: string) {
    const map: Record<string, { color: string; label: string }> = {
        COMPLETED: { color: GREEN, label: "Completed" },
        CANCELLED: { color: "#b91c1c", label: "Cancelled" },
        SCHEDULED: { color: NAV, label: "Scheduled" },
        NO_SHOW: { color: MUTED, label: "No-show" },
    };
    const s = map[status] ?? { color: MUTED, label: status };
    return <span style={{ color: s.color, fontWeight: 600, fontSize: 13 }}>{s.label}</span>;
}

export default function PackageDetailPage() {
    const params = useParams<{ id: string }>();
    const packageId = params.id;

    const [pkg, setPkg] = useState<PackageDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/proxy/packages/${packageId}`, { credentials: "include" })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then(setPkg)
            .catch(() => setError("Could not load package details."))
            .finally(() => setLoading(false));
    }, [packageId]);

    return (
        <div
            style={{
                maxWidth: 560,
                margin: "0 auto",
                padding: "24px 16px",
                fontFamily: "'Figtree', sans-serif",
            }}
        >
            <div style={{ marginBottom: 20 }}>
                <Link href="/app/packages" style={{ color: NAV, textDecoration: "none", fontSize: 14 }}>
                    ← Back to packages
                </Link>
            </div>

            {loading && <p style={{ color: MUTED }}>Loading…</p>}
            {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

            {!loading && !error && pkg && (
                <>
                    {/* Header card */}
                    <div
                        style={{
                            background: "#fff",
                            border: `1px solid ${BORDER}`,
                            borderRadius: 10,
                            padding: "20px 20px 18px",
                            marginBottom: 16,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: 16,
                            }}
                        >
                            <div>
                                <h1
                                    style={{
                                        color: NAV,
                                        fontSize: 18,
                                        fontWeight: 700,
                                        margin: "0 0 4px",
                                    }}
                                >
                                    {pkg.physio.user.name}
                                </h1>
                                <div style={{ fontSize: 14, color: MUTED }}>
                                    {pkg.size}-session package
                                </div>
                            </div>
                            {statusBadge(pkg.status)}
                        </div>

                        {/* Progress bar */}
                        <div style={{ marginBottom: 12 }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 13,
                                    color: MUTED,
                                    marginBottom: 6,
                                }}
                            >
                                <span>Sessions used</span>
                                <span style={{ fontWeight: 600, color: NAV }}>
                                    {pkg.size - pkg.remaining} / {pkg.size}
                                </span>
                            </div>
                            <div
                                style={{
                                    height: 8,
                                    borderRadius: 4,
                                    background: BORDER,
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        height: "100%",
                                        borderRadius: 4,
                                        width: `${Math.min(100, ((pkg.size - pkg.remaining) / pkg.size) * 100)}%`,
                                        background: pkg.status === "ACTIVE" ? GREEN : MUTED,
                                        transition: "width 0.3s ease",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Active reminder banner */}
                        {pkg.status === "ACTIVE" && pkg.remaining > 0 && (
                            <div
                                style={{
                                    background: "#ecfce8",
                                    border: `1px solid #b6f0a8`,
                                    borderRadius: 8,
                                    padding: "10px 14px",
                                    fontSize: 13,
                                    color: GREEN,
                                    fontWeight: 500,
                                }}
                            >
                                {pkg.remaining} session
                                {pkg.remaining !== 1 ? "s" : ""} remaining
                                {pkg.expiresAt && (
                                    <>
                                        , expires{" "}
                                        {new Date(pkg.expiresAt).toLocaleDateString("en-NG", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Expiry (non-active) */}
                        {pkg.status !== "ACTIVE" && pkg.expiresAt && (
                            <div style={{ fontSize: 13, color: MUTED }}>
                                Expired on{" "}
                                {new Date(pkg.expiresAt).toLocaleDateString("en-NG", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </div>
                        )}
                    </div>

                    {/* Sessions list */}
                    <div
                        style={{
                            background: "#fff",
                            border: `1px solid ${BORDER}`,
                            borderRadius: 10,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                padding: "14px 20px",
                                borderBottom: `1px solid ${BORDER}`,
                                fontWeight: 700,
                                color: NAV,
                                fontSize: 14,
                            }}
                        >
                            Sessions used
                        </div>

                        {pkg.sessions.length === 0 ? (
                            <div
                                style={{
                                    padding: "24px 20px",
                                    color: MUTED,
                                    fontSize: 14,
                                    textAlign: "center",
                                }}
                            >
                                No sessions used yet.
                            </div>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {pkg.sessions.map((s, i) => (
                                    <li
                                        key={s.id}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "12px 20px",
                                            borderBottom:
                                                i < pkg.sessions.length - 1 ? `1px solid ${BORDER}` : "none",
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: 14, color: NAV, fontWeight: 500 }}>
                                                Session {i + 1}
                                            </div>
                                            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                                                {new Date(s.appointment.startsAt).toLocaleDateString("en-NG", {
                                                    weekday: "short",
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </div>
                                        </div>
                                        {sessionStatusLabel(s.appointment.status)}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
