"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Package = {
    id: string;
    physio: { user: { name: string } };
    size: number;
    remaining: number;
    expiresAt: string | null;
    status: "ACTIVE" | "EXHAUSTED" | "EXPIRED";
};

const NAV = "#022449";
const GREEN = "#1b7d0e";
const MUTED = "#4f6478";
const BORDER = "#d9e3ec";

function statusBadge(status: Package["status"]) {
    const styles: Record<Package["status"], { background: string; color: string; label: string }> = {
        ACTIVE: { background: "#ecfce8", color: GREEN, label: "Active" },
        EXHAUSTED: { background: "#f1f5f9", color: MUTED, label: "Exhausted" },
        EXPIRED: { background: "#fef2f2", color: "#b91c1c", label: "Expired" },
    };
    const s = styles[status];
    return (
        <span
            style={{
                display: "inline-block",
                padding: "2px 10px",
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

export default function PatientPackagesPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/proxy/packages", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then(setPackages)
            .catch(() => setError("Could not load packages."))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div
            style={{
                maxWidth: 640,
                margin: "0 auto",
                padding: "24px 16px",
                fontFamily: "'Figtree', sans-serif",
            }}
        >
            <h1 style={{ color: NAV, fontSize: 20, fontWeight: 700, marginBottom: 20, margin: "0 0 20px" }}>
                My packages
            </h1>

            {loading && <p style={{ color: MUTED }}>Loading…</p>}
            {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

            {!loading && !error && packages.length === 0 && (
                <div
                    style={{
                        padding: "32px 24px",
                        border: `1px solid ${BORDER}`,
                        borderRadius: 10,
                        background: "#fff",
                        textAlign: "center",
                        color: MUTED,
                        fontSize: 14,
                    }}
                >
                    You have no packages yet. Buy a package when booking with a physio.
                </div>
            )}

            {!loading && !error && packages.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                    {packages.map((pkg) => {
                        return (
                            <li key={pkg.id}>
                                <Link
                                    href={`/app/packages/${pkg.id}`}
                                    style={{
                                        display: "block",
                                        padding: "16px 18px",
                                        border: `1px solid ${BORDER}`,
                                        borderRadius: 10,
                                        background: "#fff",
                                        textDecoration: "none",
                                        color: "inherit",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            marginBottom: 10,
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 700, color: NAV, fontSize: 15, marginBottom: 2 }}>
                                                {pkg.physio.user.name}
                                            </div>
                                            <div style={{ fontSize: 13, color: MUTED }}>
                                                {pkg.size}-session package
                                            </div>
                                        </div>
                                        {statusBadge(pkg.status)}
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            fontSize: 13,
                                            color: MUTED,
                                            borderTop: `1px solid ${BORDER}`,
                                            paddingTop: 10,
                                            marginTop: 2,
                                        }}
                                    >
                                        <span>
                                            <span style={{ fontWeight: 600, color: pkg.status === "ACTIVE" ? GREEN : MUTED }}>
                                                {pkg.remaining} of {pkg.size}
                                            </span>{" "}
                                            remaining
                                        </span>
                                        {pkg.expiresAt && (
                                            <span>
                                                Expires{" "}
                                                {new Date(pkg.expiresAt).toLocaleDateString("en-NG", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
