"use client";

import { useEffect, useState } from "react";
import { Card, Chip, EmptyState, Field } from "@physio/ui";
import { DISCIPLINE_LABELS } from "@physio/shared";

type Referral = {
    id: string;
    toDiscipline: string;
    reason: string;
    urgency: string;
    status: string;
    patientConsented: boolean;
    createdAt: string;
    fromProfessionalId: string;
    patient: { user: { name: string } };
    sender: { user: { name: string } };
    receiver: { user: { name: string } } | null;
};

const DISCIPLINES = Object.entries(DISCIPLINE_LABELS) as [keyof typeof DISCIPLINE_LABELS, string][];

const STATUS_VARIANT: Record<string, "default" | "accent" | "ok" | "warn" | "danger"> = {
    SENT: "default",
    PATIENT_CONSENTED: "accent",
    ACCEPTED: "ok",
    DECLINED: "danger",
    BOOKED: "ok",
    SESSION_HELD: "ok",
    SUMMARY_SENT: "ok",
    CONFIRMED: "ok",
    CLOSED: "default",
    EXPIRED: "warn",
};

export default function ProReferralsPage() {
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [acting, setActing] = useState<string | null>(null);

    // Send form state
    const [patientId, setPatientId] = useState("");
    const [discipline, setDiscipline] = useState<keyof typeof DISCIPLINE_LABELS>("PHYSIOTHERAPY");
    const [reason, setReason] = useState("");
    const [urgency, setUrgency] = useState<"ROUTINE" | "SOON" | "URGENT">("ROUTINE");
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            const [me, refs] = await Promise.all([
                fetch("/api/proxy/auth/me").then((r) => (r.ok ? r.json() : null)),
                fetch("/api/proxy/referrals/mine").then((r) => (r.ok ? r.json() : [])),
            ]);
            setCurrentUserId(me?.id ?? null);
            setReferrals(refs ?? []);
            setLoading(false);
        }
        load().catch(() => setLoading(false));
    }, []);

    async function sendReferral(e: React.FormEvent) {
        e.preventDefault();
        setSendError(null);
        setSending(true);
        try {
            const res = await fetch("/api/proxy/referrals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ patientId, toDiscipline: discipline, reason, urgency }),
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error(b.message ?? "Failed to send referral");
            }
            const created = await res.json();
            setReferrals((prev) => [created, ...prev]);
            setShowForm(false);
            setPatientId(""); setReason("");
        } catch (err) {
            setSendError((err as Error).message);
        } finally {
            setSending(false);
        }
    }

    async function respond(referralId: string, decision: "ACCEPTED" | "DECLINED") {
        setActing(referralId);
        try {
            const res = await fetch(`/api/proxy/referrals/${referralId}/respond`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision }),
            });
            if (res.ok) {
                setReferrals((prev) =>
                    prev.map((r) => (r.id === referralId ? { ...r, status: decision } : r)),
                );
            }
        } finally {
            setActing(null);
        }
    }

    if (loading) {
        return <div className="mx-auto max-w-3xl p-4"><p className="text-sm text-text-muted">Loading referrals…</p></div>;
    }

    const sent = referrals.filter((r) => r.fromProfessionalId === currentUserId);
    const received = referrals.filter((r) => r.fromProfessionalId !== currentUserId);

    return (
        <div className="mx-auto max-w-3xl p-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Referrals</h1>
                <button
                    type="button"
                    onClick={() => setShowForm((v) => !v)}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
                >
                    {showForm ? "Cancel" : "Send referral"}
                </button>
            </div>

            {showForm && (
                <Card className="mt-4">
                    <form onSubmit={sendReferral} className="flex flex-col gap-4">
                        <Field label="Patient ID" required>
                            <input
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                className="h-10 w-full rounded-md border border-border px-3 text-sm"
                                placeholder="Patient user ID (UUID)"
                                required
                            />
                        </Field>

                        <Field label="Discipline" required>
                            <div className="flex flex-wrap gap-2">
                                {DISCIPLINES.map(([key, label]) => (
                                    <button key={key} type="button" onClick={() => setDiscipline(key)}
                                        className={`rounded-md border px-3 py-1.5 text-sm font-medium ${discipline === key ? "border-primary-500 bg-primary-50 text-primary-700" : "border-border bg-surface text-text"}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </Field>

                        <Field label="Urgency" required>
                            <div className="flex gap-2">
                                {(["ROUTINE", "SOON", "URGENT"] as const).map((u) => (
                                    <button key={u} type="button" onClick={() => setUrgency(u)}
                                        className={`rounded-md border px-3 py-1.5 text-sm font-medium ${urgency === u ? "border-primary-500 bg-primary-50 text-primary-700" : "border-border bg-surface text-text"}`}>
                                        {u}
                                    </button>
                                ))}
                            </div>
                        </Field>

                        <Field label="Reason for referral" required>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="h-28 w-full rounded-md border border-border p-3 text-sm"
                                placeholder="Clinical reason (min 10 characters)"
                                required
                            />
                        </Field>

                        {sendError && <p className="text-sm text-danger-700">{sendError}</p>}
                        <button type="submit" disabled={sending}
                            className="h-10 rounded-lg bg-accent text-sm font-semibold text-white disabled:opacity-60">
                            {sending ? "Sending…" : "Send referral"}
                        </button>
                    </form>
                </Card>
            )}

            <div className="mt-6 space-y-6">
                <section>
                    <h2 className="mb-3 font-semibold">Sent</h2>
                    {sent.length === 0 ? (
                        <EmptyState title="No sent referrals" description="Referrals you send will appear here." />
                    ) : (
                        <ul className="flex flex-col gap-3">
                            {sent.map((ref) => (
                                <li key={ref.id}>
                                    <Card>
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-medium">{ref.patient.user.name}</p>
                                                    <Chip>{DISCIPLINE_LABELS[ref.toDiscipline as keyof typeof DISCIPLINE_LABELS] ?? ref.toDiscipline}</Chip>
                                                    <Chip variant={STATUS_VARIANT[ref.status] ?? "default"}>{ref.status.replace(/_/g, " ")}</Chip>
                                                </div>
                                                <p className="mt-1 text-sm text-text-muted">{ref.reason.slice(0, 100)}{ref.reason.length > 100 ? "…" : ""}</p>
                                            </div>
                                        </div>
                                    </Card>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section>
                    <h2 className="mb-3 font-semibold">Received</h2>
                    {received.length === 0 ? (
                        <EmptyState title="No received referrals" description="Referrals sent to you will appear here." />
                    ) : (
                        <ul className="flex flex-col gap-3">
                            {received.map((ref) => (
                                <li key={ref.id}>
                                    <Card>
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-medium">{ref.patient.user.name}</p>
                                                    <Chip variant={STATUS_VARIANT[ref.status] ?? "default"}>{ref.status.replace(/_/g, " ")}</Chip>
                                                </div>
                                                <p className="mt-1 text-xs text-text-muted">From {ref.sender.user.name}</p>
                                                <p className="mt-1 text-sm text-text">{ref.reason.slice(0, 100)}{ref.reason.length > 100 ? "…" : ""}</p>
                                            </div>
                                        </div>
                                        {ref.status === "PATIENT_CONSENTED" && (
                                            <div className="mt-3 flex gap-2">
                                                <button type="button" disabled={acting === ref.id}
                                                    onClick={() => respond(ref.id, "ACCEPTED")}
                                                    className="rounded-md bg-ok-bg px-4 py-1.5 text-sm font-medium text-ok-text disabled:opacity-60">
                                                    Accept
                                                </button>
                                                <button type="button" disabled={acting === ref.id}
                                                    onClick={() => respond(ref.id, "DECLINED")}
                                                    className="rounded-md bg-danger-bg px-4 py-1.5 text-sm font-medium text-danger-text disabled:opacity-60">
                                                    Decline
                                                </button>
                                            </div>
                                        )}
                                    </Card>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
