"use client";

import { useState } from "react";

const NEXT_STATUS: Record<string, string> = {
    OPEN: "CONTACTED",
    CONTACTED: "RESOLVED",
    RESOLVED: "CLOSED",
};

export default function FallbackCaseActions({
    id,
    currentStatus,
}: {
    id: string;
    currentStatus: string;
}) {
    const [status, setStatus] = useState(currentStatus);
    const [loading, setLoading] = useState(false);

    const next = NEXT_STATUS[status];
    if (!next) return <span className="text-xs text-text-muted">Closed</span>;

    async function advance() {
        if (!next) return;
        setLoading(true);
        try {
            await fetch(`/api/proxy/admin/fallback-cases/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: next }),
            });
            setStatus(next);
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            type="button"
            disabled={loading}
            onClick={advance}
            className="rounded bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
            {loading ? "…" : `Mark ${next.toLowerCase()}`}
        </button>
    );
}
