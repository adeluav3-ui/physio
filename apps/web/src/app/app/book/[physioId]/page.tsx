"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Card } from "@physio/ui";

type Slot = { startsAt: string; durationMinutes: number; mode: "VIDEO" | "HOME" };

export default function BookPage() {
    const router = useRouter();
    const params = useParams<{ physioId: string }>();
    const [slots, setSlots] = useState<Slot[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/proxy/booking/slots/${params.physioId}`)
            .then((r) => r.json())
            .then(setSlots)
            .catch((e) => setError((e as Error).message));
    }, [params.physioId]);

    async function onPay() {
        if (!selected) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/proxy/booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    physioId: params.physioId,
                    type: "ASSESSMENT",
                    mode: slots.find((s) => s.startsAt === selected)?.mode ?? "VIDEO",
                    startsAt: selected,
                    durationMinutes: 45,
                }),
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.message ?? "Booking failed");
            }
            const { authorizationUrl } = await res.json();
            window.location.href = authorizationUrl;
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-2xl p-4">
            <h1 className="text-2xl font-semibold">Pick a time</h1>

            <Card className="mt-6" padding="md">
                {slots.length === 0 && <p className="text-sm text-text-muted">No slots available in the next 14 days.</p>}
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {slots.slice(0, 24).map((s) => {
                        const d = new Date(s.startsAt);
                        const active = selected === s.startsAt;
                        return (
                            <li key={s.startsAt}>
                                <button
                                    type="button"
                                    onClick={() => setSelected(s.startsAt)}
                                    className={`h-12 w-full rounded-md border text-sm font-medium ${active ? "border-primary-500 bg-primary-50 text-primary-700" : "border-border bg-surface"
                                        }`}
                                >
                                    {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
                                    {d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </Card>

            {error && <p className="mt-4 text-sm text-danger-700">{error}</p>}

            <div className="mt-6">
                <Button onClick={onPay} disabled={!selected} loading={loading} fullWidth>
                    Pay & book
                </Button>
            </div>
        </div>
    );
}