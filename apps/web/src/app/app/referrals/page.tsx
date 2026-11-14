"use client";

import { useEffect, useState } from "react";

type Referral = {
    id: string;
    toDiscipline: string;
    reason: string;
    urgency: string;
    status: string;
    patientConsented: boolean;
    shareAssessmentNote: boolean;
    sharePlan: boolean;
    declineReason: string | null;
    createdAt: string;
    sender: { user: { name: string } };
    receiver: { user: { name: string } } | null;
};

const NAV = "#022449";
const GREEN = "#1b7d0e";
const MUTED = "#4f6478";
const BORDER = "#d9e3ec";

const DISCIPLINE_LABELS: Record<string, string> = {
    PHYSIOTHERAPY: "Physiotherapy",
    OCCUPATIONAL_THERAPY: "Occupational therapy",
    SPEECH_THERAPY: "Speech therapy",
    PROSTHETICS: "Prosthetics",
    ORTHOTICS: "Orthotics",
};

const STATUS_LABEL: Record<string, string> = {
    SENT: "Waiting for your consent",
    PATIENT_CONSENTED: "Consent given — specialist reviewing",
    ACCEPTED: "Accepted — book your appointment",
    DECLINED: "Declined",
    BOOKED: "Appointment booked",
    SESSION_HELD: "Session held",
    SUMMARY_SENT: "Summary available",
    CONFIRMED: "Complete",
    CLOSED: "Closed",
    EXPIRED: "Expired",
};

function statusChip(status: string) {
    const map: Record<string, { bg: string; color: string }> = {
        SENT: { bg: "#fdf1d8", color: "#7a4f00" },
        PATIENT_CONSENTED: { bg: "#dbeafe", color: "#1e40af" },
        ACCEPTED: { bg: "#e3f4e8", color: "#1d5c34" },
        DECLINED: { bg: "#fce4e4", color: "#7f1d1d" },
        BOOKED: { bg: "#e3f4e8", color: "#1d5c34" },
        SESSION_HELD: { bg: "#e3f4e8", color: "#1d5c34" },
        SUMMARY_SENT: { bg: "#e3f4e8", color: "#1d5c34" },
        CONFIRMED: { bg: "#e3f4e8", color: "#1d5c34" },
        CLOSED: { bg: "#eef3f8", color: MUTED },
        EXPIRED: { bg: "#eef3f8", color: MUTED },
    };
    return map[status] ?? { bg: "#eef3f8", color: MUTED };
}

export default function PatientReferralsPage() {
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [consenting, setConsenting] = useState<string | null>(null);
    const [withdrawing, setWithdrawing] = useState<string | null>(null);
    const [confirmWithdraw, setConfirmWithdraw] = useState<string | null>(null);

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

    async function withdraw(referralId: string) {
        setWithdrawing(referralId);
        try {
            const res = await fetch(`/api/proxy/referrals/${referralId}/withdraw`, { method: "POST" });
            if (res.ok) {
                setReferrals((prev) =>
                    prev.map((r) => r.id === referralId ? { ...r, status: "EXPIRED", patientConsented: false } : r),
                );
                setConfirmWithdraw(null);
            }
        } finally {
            setWithdrawing(null);
        }
    }

    if (loading) {
        return (
            <div style={{ display: "flex", minHeight: "60vh", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', system-ui, sans-serif" }}>
                <p style={{ fontSize: 14, color: MUTED }}>Loading referrals…</p>
            </div>
        );
    }

    return (
        <div style={{ padding: "24px 20px", fontFamily: "'Figtree', system-ui, sans-serif", color: NAV, maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
                <h1 style={{ font: "700 26px 'Figtree', sans-serif", margin: 0 }}>Referrals</h1>
                <p style={{ font: "400 15px 'Figtree', sans-serif", color: MUTED, margin: "4px 0 0" }}>
                    Your care team may refer you to another specialist. You must give your consent before any of your information is shared.
                </p>
            </div>

            {referrals.length === 0 ? (
                <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, textAlign: "center" }}>
                    <p style={{ font: "500 15px 'Figtree', sans-serif", color: MUTED, margin: 0 }}>No referrals yet.</p>
                    <p style={{ font: "400 14px 'Figtree', sans-serif", color: MUTED, marginTop: 4 }}>
                        Your professional will appear here if they refer you to another specialist.
                    </p>
                </div>
            ) : (
                referrals.map((ref) => {
                    const sc = statusChip(ref.status);
                    const isActive = ref.status === "SENT" || ref.status === "PATIENT_CONSENTED";
                    const needsConsent = ref.status === "SENT" && !ref.patientConsented;
                    const hasConsented = ref.patientConsented && ref.status !== "EXPIRED";

                    return (
                        <div key={ref.id} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
                            {/* Header */}
                            <div style={{ padding: "14px 16px 12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                                    <div>
                                        <div style={{ font: "600 16px 'Figtree', sans-serif", color: NAV }}>
                                            {DISCIPLINE_LABELS[ref.toDiscipline] ?? ref.toDiscipline}
                                        </div>
                                        <div style={{ font: "400 13px 'Figtree', sans-serif", color: MUTED, marginTop: 2 }}>
                                            From {ref.sender.user.name}
                                            {ref.receiver ? ` → ${ref.receiver.user.name}` : ""}
                                        </div>
                                    </div>
                                    <span style={{ padding: "3px 10px", borderRadius: 99, font: "600 11px 'Figtree', sans-serif", ...sc, flexShrink: 0 }}>
                                        {STATUS_LABEL[ref.status] ?? ref.status.replace(/_/g, " ")}
                                    </span>
                                </div>
                                <p style={{ font: "400 14px/1.5 'Figtree', sans-serif", color: NAV, margin: "10px 0 0" }}>
                                    {ref.reason}
                                </p>
                                {ref.status === "DECLINED" && ref.declineReason && (
                                    <p style={{ font: "400 13px 'Figtree', sans-serif", color: "#7f1d1d", marginTop: 8 }}>
                                        Reason: {ref.declineReason}
                                    </p>
                                )}
                                <p style={{ font: "400 12px 'Figtree', sans-serif", color: MUTED, marginTop: 8 }}>
                                    {new Date(ref.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                                </p>
                            </div>

                            {/* Consent prompt */}
                            {needsConsent && (
                                <div style={{ background: "#fdf9ee", borderTop: "1px solid #ecd49b", padding: 16 }}>
                                    <p style={{ font: "600 14px 'Figtree', sans-serif", color: "#7a4f00", margin: "0 0 6px" }}>
                                        Your consent is needed
                                    </p>
                                    <p style={{ font: "400 13px/1.5 'Figtree', sans-serif", color: "#7a4f00", margin: "0 0 10px" }}>
                                        By consenting, you allow the following to be shared with the receiving specialist:
                                    </p>
                                    <ul style={{ margin: "0 0 12px", padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 2 }}>
                                        <li style={{ font: "400 13px 'Figtree', sans-serif", color: "#7a4f00" }}>
                                            Your name and contact
                                        </li>
                                        {ref.shareAssessmentNote && (
                                            <li style={{ font: "400 13px 'Figtree', sans-serif", color: "#7a4f00" }}>
                                                Your signed assessment note
                                            </li>
                                        )}
                                        {ref.sharePlan && (
                                            <li style={{ font: "400 13px 'Figtree', sans-serif", color: "#7a4f00" }}>
                                                Your current exercise plan
                                            </li>
                                        )}
                                    </ul>
                                    <button
                                        disabled={consenting === ref.id}
                                        onClick={() => consent(ref.id)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "100%",
                                            minHeight: 46,
                                            borderRadius: 12,
                                            background: consenting === ref.id ? "#999" : GREEN,
                                            color: "#fff",
                                            font: "600 15px 'Figtree', sans-serif",
                                            border: 0,
                                            cursor: consenting === ref.id ? "not-allowed" : "pointer",
                                        }}
                                    >
                                        {consenting === ref.id ? "Saving…" : "I consent — share my information"}
                                    </button>
                                </div>
                            )}

                            {/* Withdraw consent option */}
                            {hasConsented && isActive && (
                                <div style={{ borderTop: `1px solid ${BORDER}`, padding: "12px 16px" }}>
                                    {confirmWithdraw === ref.id ? (
                                        <div>
                                            <p style={{ font: "500 13px/1.5 'Figtree', sans-serif", color: NAV, margin: "0 0 10px" }}>
                                                Withdrawing your consent will stop sharing and cancel this referral. Are you sure?
                                            </p>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button
                                                    disabled={withdrawing === ref.id}
                                                    onClick={() => withdraw(ref.id)}
                                                    style={{ flex: 1, minHeight: 40, borderRadius: 10, background: "#b91c1c", color: "#fff", font: "600 13px 'Figtree', sans-serif", border: 0, cursor: "pointer" }}
                                                >
                                                    {withdrawing === ref.id ? "…" : "Withdraw consent"}
                                                </button>
                                                <button
                                                    onClick={() => setConfirmWithdraw(null)}
                                                    style={{ flex: 1, minHeight: 40, borderRadius: 10, background: "#fff", color: NAV, font: "600 13px 'Figtree', sans-serif", border: `1px solid ${BORDER}`, cursor: "pointer" }}
                                                >
                                                    Keep consent
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmWithdraw(ref.id)}
                                            style={{ font: "500 13px 'Figtree', sans-serif", color: MUTED, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                                        >
                                            Withdraw consent
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })
            )}

            {/* Care team summary */}
            {referrals.some((r) => r.status !== "EXPIRED" && r.status !== "DECLINED") && (
                <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16 }}>
                    <h2 style={{ font: "700 16px 'Figtree', sans-serif", margin: "0 0 10px" }}>My care team</h2>
                    {referrals
                        .filter((r) => r.status !== "EXPIRED" && r.status !== "DECLINED")
                        .map((r) => (
                            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
                                <div>
                                    <div style={{ font: "600 14px 'Figtree', sans-serif" }}>
                                        {r.receiver?.user.name ?? DISCIPLINE_LABELS[r.toDiscipline] ?? r.toDiscipline}
                                    </div>
                                    <div style={{ font: "400 12px 'Figtree', sans-serif", color: MUTED }}>
                                        {DISCIPLINE_LABELS[r.toDiscipline] ?? r.toDiscipline}
                                    </div>
                                </div>
                                <span style={{ padding: "2px 8px", borderRadius: 99, font: "600 11px 'Figtree', sans-serif", ...statusChip(r.status) }}>
                                    {r.status.replace(/_/g, " ").toLowerCase()}
                                </span>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
