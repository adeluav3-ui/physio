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
    fromProfessionalId: string;
    patient: { user: { name: string } };
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

function statusChip(status: string) {
    const map: Record<string, { bg: string; color: string; label: string }> = {
        SENT: { bg: "#eef3f8", color: MUTED, label: "Sent" },
        PATIENT_CONSENTED: { bg: "#dbeafe", color: "#1e40af", label: "Patient consented" },
        ACCEPTED: { bg: "#e3f4e8", color: "#1d5c34", label: "Accepted" },
        DECLINED: { bg: "#fce4e4", color: "#7f1d1d", label: "Declined" },
        BOOKED: { bg: "#e3f4e8", color: "#1d5c34", label: "Booked" },
        SESSION_HELD: { bg: "#e3f4e8", color: "#1d5c34", label: "Session held" },
        SUMMARY_SENT: { bg: "#e3f4e8", color: "#1d5c34", label: "Summary sent" },
        CONFIRMED: { bg: "#e3f4e8", color: "#1d5c34", label: "Confirmed" },
        CLOSED: { bg: "#eef3f8", color: MUTED, label: "Closed" },
        EXPIRED: { bg: "#fdf1d8", color: "#7a4f00", label: "Expired" },
    };
    return map[status] ?? { bg: "#eef3f8", color: MUTED, label: status };
}

function urgencyChip(urgency: string) {
    if (urgency === "URGENT") return { bg: "#fce4e4", color: "#7f1d1d" };
    if (urgency === "SOON") return { bg: "#fdf1d8", color: "#7a4f00" };
    return { bg: "#eef3f8", color: MUTED };
}

export default function ProReferralsPage() {
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState<string | null>(null);
    const [declineId, setDeclineId] = useState<string | null>(null);
    const [declineReason, setDeclineReason] = useState("");
    const [declineError, setDeclineError] = useState<string | null>(null);

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

    async function accept(referralId: string) {
        setActing(referralId);
        try {
            const res = await fetch(`/api/proxy/referrals/${referralId}/respond`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision: "ACCEPTED" }),
            });
            if (res.ok) {
                setReferrals((prev) => prev.map((r) => r.id === referralId ? { ...r, status: "ACCEPTED" } : r));
            }
        } finally {
            setActing(null);
        }
    }

    async function decline(referralId: string) {
        if (!declineReason.trim()) { setDeclineError("A reason is required"); return; }
        setActing(referralId);
        setDeclineError(null);
        try {
            const res = await fetch(`/api/proxy/referrals/${referralId}/respond`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision: "DECLINED", reason: declineReason }),
            });
            if (res.ok) {
                setReferrals((prev) => prev.map((r) => r.id === referralId ? { ...r, status: "DECLINED", declineReason } : r));
                setDeclineId(null);
                setDeclineReason("");
            }
        } finally {
            setActing(null);
        }
    }

    if (loading) {
        return (
            <div style={{ display: "flex", minHeight: "60vh", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', system-ui, sans-serif" }}>
                <p style={{ fontSize: 14, color: MUTED }}>Loading referrals…</p>
            </div>
        );
    }

    const sent = referrals.filter((r) => r.fromProfessionalId === currentUserId);
    const received = referrals.filter((r) => r.fromProfessionalId !== currentUserId);

    const field: React.CSSProperties = { display: "block", width: "100%", border: "1px solid #b4c4d3", borderRadius: 10, padding: "8px 12px", font: "14px/1.4 'Figtree', sans-serif", color: NAV, background: "#fff", resize: "vertical" };

    function ReferralCard({ ref: r, isSent }: { ref: Referral; isSent: boolean }) {
        const sc = statusChip(r.status);
        const uc = urgencyChip(r.urgency);
        const isDeclineOpen = declineId === r.id;

        return (
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ font: "600 15px 'Figtree', sans-serif", color: NAV }}>
                                {r.patient.user.name}
                            </span>
                            <span style={{ padding: "2px 8px", borderRadius: 99, font: "600 11px 'Figtree', sans-serif", background: "#eef3f8", color: MUTED }}>
                                {DISCIPLINE_LABELS[r.toDiscipline] ?? r.toDiscipline}
                            </span>
                            <span style={{ padding: "2px 8px", borderRadius: 99, font: "600 11px 'Figtree', sans-serif", ...uc }}>
                                {r.urgency}
                            </span>
                            <span style={{ padding: "2px 8px", borderRadius: 99, font: "600 11px 'Figtree', sans-serif", background: sc.bg, color: sc.color }}>
                                {sc.label}
                            </span>
                        </div>
                        <p style={{ font: "400 13px/1.5 'Figtree', sans-serif", color: MUTED, margin: "0 0 6px" }}>
                            {isSent
                                ? `To: ${r.receiver?.user.name ?? DISCIPLINE_LABELS[r.toDiscipline] ?? r.toDiscipline}`
                                : `From: ${r.sender.user.name}`}
                        </p>
                        <p style={{ font: "400 14px/1.5 'Figtree', sans-serif", color: NAV, margin: 0 }}>
                            {r.reason.length > 140 ? r.reason.slice(0, 140) + "…" : r.reason}
                        </p>
                        {(r.shareAssessmentNote || r.sharePlan) && (
                            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                                {r.shareAssessmentNote && (
                                    <span style={{ padding: "2px 8px", borderRadius: 99, font: "600 11px 'Figtree', sans-serif", background: "#eef3f8", color: MUTED }}>
                                        Note shared
                                    </span>
                                )}
                                {r.sharePlan && (
                                    <span style={{ padding: "2px 8px", borderRadius: 99, font: "600 11px 'Figtree', sans-serif", background: "#eef3f8", color: MUTED }}>
                                        Plan shared
                                    </span>
                                )}
                                {!r.patientConsented && (
                                    <span style={{ padding: "2px 8px", borderRadius: 99, font: "600 11px 'Figtree', sans-serif", background: "#fdf1d8", color: "#7a4f00" }}>
                                        Awaiting consent
                                    </span>
                                )}
                            </div>
                        )}
                        {r.status === "DECLINED" && r.declineReason && (
                            <p style={{ font: "400 13px 'Figtree', sans-serif", color: "#7f1d1d", marginTop: 8 }}>
                                Decline reason: {r.declineReason}
                            </p>
                        )}
                    </div>
                    <div style={{ font: "400 12px 'Figtree', sans-serif", color: MUTED, flexShrink: 0 }}>
                        {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </div>
                </div>

                {/* Received + consented: show accept/decline */}
                {!isSent && r.status === "PATIENT_CONSENTED" && (
                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                        {!isDeclineOpen ? (
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    disabled={acting === r.id}
                                    onClick={() => accept(r.id)}
                                    style={{ flex: 1, minHeight: 40, borderRadius: 10, background: GREEN, color: "#fff", font: "600 14px 'Figtree', sans-serif", border: 0, cursor: "pointer", opacity: acting === r.id ? 0.6 : 1 }}
                                >
                                    {acting === r.id ? "…" : "Accept"}
                                </button>
                                <button
                                    disabled={acting === r.id}
                                    onClick={() => { setDeclineId(r.id); setDeclineReason(""); setDeclineError(null); }}
                                    style={{ flex: 1, minHeight: 40, borderRadius: 10, background: "#fff", color: "#7f1d1d", font: "600 14px 'Figtree', sans-serif", border: "1.5px solid #fca5a5", cursor: "pointer" }}
                                >
                                    Decline
                                </button>
                            </div>
                        ) : (
                            <div style={{ background: "#fef9f9", border: "1px solid #fca5a5", borderRadius: 10, padding: 12 }}>
                                <p style={{ font: "600 13px 'Figtree', sans-serif", color: "#7f1d1d", margin: "0 0 8px" }}>Reason for declining *</p>
                                <textarea
                                    value={declineReason}
                                    onChange={(e) => setDeclineReason(e.target.value)}
                                    rows={3}
                                    placeholder="Explain why you are declining…"
                                    style={field}
                                />
                                {declineError && <p style={{ font: "400 12px 'Figtree', sans-serif", color: "#b91c1c", marginTop: 4 }}>{declineError}</p>}
                                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                    <button
                                        disabled={acting === r.id}
                                        onClick={() => decline(r.id)}
                                        style={{ flex: 1, minHeight: 38, borderRadius: 10, background: "#b91c1c", color: "#fff", font: "600 13px 'Figtree', sans-serif", border: 0, cursor: "pointer" }}
                                    >
                                        {acting === r.id ? "…" : "Confirm decline"}
                                    </button>
                                    <button
                                        onClick={() => setDeclineId(null)}
                                        style={{ flex: 1, minHeight: 38, borderRadius: 10, background: "#fff", color: NAV, font: "600 13px 'Figtree', sans-serif", border: `1px solid ${BORDER}`, cursor: "pointer" }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ padding: "24px 20px", fontFamily: "'Figtree', system-ui, sans-serif", color: NAV, maxWidth: 720, margin: "0 auto" }}>
            <h1 style={{ font: "700 26px 'Figtree', sans-serif", margin: "0 0 4px" }}>Referrals</h1>
            <p style={{ font: "400 15px 'Figtree', sans-serif", color: MUTED, margin: "0 0 24px" }}>
                Referrals you send and receive appear here.
            </p>

            {received.length > 0 && (
                <section style={{ marginBottom: 32 }}>
                    <h2 style={{ font: "600 16px 'Figtree', sans-serif", margin: "0 0 12px", color: NAV }}>Received</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {received.map((r) => <ReferralCard key={r.id} ref={r} isSent={false} />)}
                    </div>
                </section>
            )}

            <section>
                <h2 style={{ font: "600 16px 'Figtree', sans-serif", margin: "0 0 12px", color: NAV }}>Sent</h2>
                {sent.length === 0 ? (
                    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, textAlign: "center" }}>
                        <p style={{ font: "400 14px 'Figtree', sans-serif", color: MUTED, margin: 0 }}>
                            No referrals sent yet. Use the Refer tab during a session to send one.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {sent.map((r) => <ReferralCard key={r.id} ref={r} isSent={true} />)}
                    </div>
                )}
            </section>
        </div>
    );
}
