"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@physio/ui";

const JOIN_WINDOW_MS = 15 * 60 * 1000;

function getState(startsAt: string, endsAt: string) {
    const now = Date.now();
    const start = new Date(startsAt).getTime();
    const end = new Date(endsAt).getTime();
    const windowOpen = start - JOIN_WINDOW_MS;
    if (now < windowOpen) return { phase: "waiting" as const, msUntil: windowOpen - now };
    if (now <= end + 90 * 60 * 1000) return { phase: "open" as const, msUntil: 0 };
    return { phase: "ended" as const, msUntil: 0 };
}

export function JoinSection({
    appointmentId,
    startsAt,
    endsAt,
    mode,
    status,
}: {
    appointmentId: string;
    startsAt: string;
    endsAt: string;
    mode: string;
    status: string;
}) {
    const router = useRouter();
    const [win, setWin] = useState(() => getState(startsAt, endsAt));

    useEffect(() => {
        if (win.phase !== "waiting") return;
        const t = setTimeout(() => {
            setWin(getState(startsAt, endsAt));
            router.refresh();
        }, win.msUntil);
        return () => clearTimeout(t);
    }, [win, startsAt, endsAt, router]);

    if (mode !== "VIDEO") return null;
    if (status !== "CONFIRMED" && status !== "IN_PROGRESS") return null;

    if (win.phase === "open") {
        return (
            <Link
                href={`/app/session/${appointmentId}`}
                className="block rounded-lg bg-primary-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-primary-700"
            >
                Join session
            </Link>
        );
    }

    if (win.phase === "waiting") {
        const mins = Math.ceil(win.msUntil / 60_000);
        return (
            <Card>
                <p className="text-sm text-text-muted">
                    {mins <= 1
                        ? "The Join session button will appear in less than a minute."
                        : `The Join session button will appear in ${mins} minute${mins === 1 ? "" : "s"}.`}
                </p>
            </Card>
        );
    }

    return null;
}
