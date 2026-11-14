"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Thread = {
    id: string;
    physio: { name: string };
    messages: { body: string; sentAt: string; senderId: string }[];
    updatedAt: string;
};

const NAV = "#022449";
const MUTED = "#4f6478";
const BORDER = "#d9e3ec";
const GROUND = "#f4f8fb";

export default function PatientMessagesPage() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/threads", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then(setThreads)
            .catch(() => setError("Could not load messages."))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
            <h1 style={{ color: NAV, fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Messages</h1>

            {loading && <p style={{ color: MUTED }}>Loading…</p>}
            {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

            {!loading && !error && threads.length === 0 && (
                <p style={{ color: MUTED }}>No message threads yet. Start a conversation from your appointment page.</p>
            )}

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {threads.map((t) => {
                    const last = t.messages[0];
                    return (
                        <li key={t.id}>
                            <Link
                                href={`/app/messages/${t.id}`}
                                style={{
                                    display: "block",
                                    padding: "14px 16px",
                                    border: `1px solid ${BORDER}`,
                                    borderRadius: 8,
                                    background: "#fff",
                                    textDecoration: "none",
                                    color: "inherit",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontWeight: 600, color: NAV }}>{t.physio.name}</span>
                                    <span style={{ fontSize: 12, color: MUTED }}>
                                        {last ? new Date(last.sentAt).toLocaleDateString() : ""}
                                    </span>
                                </div>
                                {last && (
                                    <p style={{ margin: 0, fontSize: 14, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {last.body}
                                    </p>
                                )}
                                {!last && (
                                    <p style={{ margin: 0, fontSize: 14, color: MUTED, fontStyle: "italic" }}>No messages yet</p>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
