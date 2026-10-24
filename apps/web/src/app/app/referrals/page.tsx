"use client";

import { useEffect, useState } from "react";
import { Card, Chip, EmptyState } from "@physio/ui";
import { DISCIPLINE_LABELS } from "@physio/shared";

type Referral = {
    id: string;
    toDiscipline: string;
    reason: string;
    urgency: string;
    status: string;
    patientConsented: boolean;
    createdAt: string;
    sender: { user: { name: string } };
    receiver: { user: { name: string } } | null;
};

const STATUS_VARIANT: Record<string, "default" | "accent" | "ok" | "warn" | "danger"> = {
    SENT: "default",
    PATIENT_CONSENTED: "accent",
    ACCEPTED: "accent",
    DECLINED: "danger",
    BOOKED: "ok",
    SESSION_HELD: "ok",
    SUMMARY_SENT: "ok",
    CONFIRMED: "ok",
    CLOSED: "default",
    EXPIRED: "warn",
};

const URGENCY_VARIANT: Record<string, "default" | "warn" | "danger"> = {
    ROUTINE: "default",
    SOON: "warn",
    URGENT: "danger",
};

export default function PatientReferralsPage() {
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [consenting, setConsenting] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/proxy/referrals/patient")
            .then((r) => (r.ok ? r.json() : []))
            .then(setReferrals)
            .catch(() => setReferrals([]))
            .finally(() => setLoading(false));
    }, []);

    async function consent(referralId: string) {
        setConsenting(referralId);
        try {
            const res = await fetch(`/api/proxy/referrals/${referralId}/consent`, { method: "POST" });
            if (res.ok) {
                setReferrals((prev) =>
                    prev.map((r) =>
                        r.id === referralId ? { ...r, status: "PATIENT_CONSENTED", patientConsented: true } : r,
                    ),
                );
            }
        } finally {
            setConsenting(null);
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-2xl p-4">
                <p className="text-sm text-text-muted">Loading referrals…</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl p-4">
            <h1 className="text-2xl font-semibold">Referrals</h1>
            <p className="mt-1 text-sm text-text-muted">
                Your care team may refer you to another specialist. You must consent before your information is shared.
            </p>

            {referrals.length === 0 ? (
                <EmptyState className="mt-8" title="No referrals yet" description="Referrals from your care team will appear here." />
            ) : (
                <ul className="mt-6 flex flex-col gap-3">
                    {referrals.map((ref) => (
                        <li key={ref.id}>
                            <Card>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold">
                                                {DISCIPLINE_LABELS[ref.toDiscipline as keyof typeof DISCIPLINE_LABELS] ?? ref.toDiscipline}
                                            </p>
                                            <Chip variant={STATUS_VARIANT[ref.status] ?? "default"}>
                                                {ref.status.replace(/_/g, " ")}
                                            </Chip>
                                            <Chip variant={URGENCY_VARIANT[ref.urgency] ?? "default"}>
                                                {ref.urgency}
                                            </Chip>
                                        </div>
                                        <p className="mt-1 text-sm text-text-muted">
                                            From {ref.sender.user.name}
                                            {ref.receiver ? ` → ${ref.receiver.user.name}` : ""}
                                        </p>
                                        <p className="mt-2 text-sm text-text">{ref.reason}</p>
                                        <p className="mt-1 text-xs text-text-muted">
                                            {new Date(ref.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {ref.status === "SENT" && !ref.patientConsented && (
                                    <div className="mt-4 rounded-md bg-warn-bg p-3">
                                        <p className="text-sm font-medium text-warn-text">Your consent is needed</p>
                                        <p className="mt-1 text-xs text-warn-text">
                                            By consenting, you allow your care summary to be shared with the receiving specialist.
                                        </p>
                                        <button
                                            type="button"
                                            disabled={consenting === ref.id}
                                            onClick={() => consent(ref.id)}
                                            className="mt-3 rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                                        >
                                            {consenting === ref.id ? "…" : "I consent"}
                                        </button>
                                    </div>
                                )}
                            </Card>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
