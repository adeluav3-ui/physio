"use client";

import { useEffect, useState } from "react";
import { DISCIPLINE_LABELS } from "@physio/shared";

type Referral = {
    id: string; toDiscipline: string; reason: string; urgency: string;
    status: string; createdAt: string; fromProfessionalId: string;
    patient: { user: { name: string } };
    sender: { user: { name: string } };
    receiver: { user: { name: string } } | null;
};

const STATUS_CHIP: Record<string, string> = {
    SENT: "warn", PATIENT_CONSENTED: "", ACCEPTED: "ok", DECLINED: "bad",
    BOOKED: "ok", SESSION_HELD: "ok", SUMMARY_SENT: "ok", CONFIRMED: "ok",
    CLOSED: "", EXPIRED: "warn",
};
const STATUS_LABEL: Record<string, string> = {
    SENT: "Waiting for reply", PATIENT_CONSENTED: "Consented", ACCEPTED: "Accepted",
    DECLINED: "Declined", BOOKED: "Booked", SESSION_HELD: "Session held",
    SUMMARY_SENT: "Confirm", CONFIRMED: "Confirmed", CLOSED: "Closed", EXPIRED: "Expired",
};

const TIMELINE_STEPS = [
    "Referral sent", "Patient agreed", "Receiver accepts",
    "Patient books", "Session held", "Summary sent back and confirmed",
];

export default function ProReferralsPage() {
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [meId, setMeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Referral | null>(null);
    const [acting, setActing] = useState<string | null>(null);

    /* Send form */
    const [patientId, setPatientId] = useState("");
    const [referTo, setReferTo] = useState("");
    const [reason, setReason] = useState("");
    const [urgency, setUrgency] = useState<"ROUTINE" | "SOON" | "URGENT">("SOON");
    const [shareAssessment, setShareAssessment] = useState(true);
    const [sharePlan, setSharePlan] = useState(true);
    const [shareMessages, setShareMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            fetch("/api/proxy/auth/me").then(r => r.ok ? r.json() : null),
            fetch("/api/proxy/referrals/mine").then(r => r.ok ? r.json() : []),
        ]).then(([me, refs]) => {
            setMeId(me?.id ?? null);
            const list = refs ?? [];
            setReferrals(list);
            if (list.length > 0) setSelected(list[0]);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    async function sendReferral(e: React.FormEvent) {
        e.preventDefault();
        setSendError(null); setSending(true);
        try {
            const res = await fetch("/api/proxy/referrals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ patientId, toDiscipline: referTo, reason, urgency }),
            });
            if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.message ?? "Failed"); }
            const created = await res.json();
            setReferrals(prev => [created, ...prev]);
            setSelected(created);
            setPatientId(""); setReferTo(""); setReason("");
        } catch (err) { setSendError((err as Error).message); }
        finally { setSending(false); }
    }

    async function respond(id: string, decision: "ACCEPTED" | "DECLINED") {
        setActing(id);
        try {
            const res = await fetch(`/api/proxy/referrals/${id}/respond`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision }),
            });
            if (res.ok) setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: decision } : r));
        } finally { setActing(null); }
    }

    const sent = referrals.filter(r => r.fromProfessionalId === meId);
    const received = referrals.filter(r => r.fromProfessionalId !== meId);

    /* Timeline step index for selected referral */
    const TL_STATUS_IDX: Record<string, number> = {
        SENT: 0, PATIENT_CONSENTED: 1, ACCEPTED: 2, BOOKED: 3, SESSION_HELD: 4, SUMMARY_SENT: 5, CONFIRMED: 5,
    };

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
                <div className="muted" style={{ font: "400 15px 'Figtree',sans-serif" }}>Loading…</div>
            </div>
        );
    }

    return (
        <>
            <h1 style={{ font: "700 28px 'Figtree',sans-serif", margin: 0 }}>Referrals</h1>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <span className="chip" style={{ background: "#1b7d0e", color: "#fff", padding: "8px 14px" }}>Sent {sent.length}</span>
                <span className="chip" style={{ padding: "8px 14px" }}>Received {received.length}</span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "20px", alignItems: "flex-start" }}>
                {/* Send form */}
                <div className="card" style={{ flex: "1 1 380px" }}>
                    <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>Send a referral</h2>
                    <form onSubmit={sendReferral} style={{ display: "grid", gap: "14px", marginTop: "16px" }}>
                        <div>
                            <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Patient</label>
                            <input className="in" value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="[Patient name or ID]" required />
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                            <div style={{ flex: "1 1 160px" }}>
                                <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Refer to</label>
                                <input className="in" value={referTo} onChange={e => setReferTo(e.target.value)} placeholder="Orthotist" required />
                            </div>
                            <div style={{ flex: "1 1 160px" }}>
                                <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Professional</label>
                                <input className="in" placeholder="Any available" />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Reason (required)</label>
                            <input className="in" value={reason} onChange={e => setReason(e.target.value)} placeholder="Needs an ankle brace for foot drop" style={{ minHeight: "70px" }} required />
                        </div>
                        <div>
                            <div style={{ font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Urgency (required)</div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {(["ROUTINE", "SOON", "URGENT"] as const).map(u => (
                                    <button key={u} type="button"
                                        className={`chip${urgency === u ? (u === "URGENT" ? " warn" : " stcur") : ""}`}
                                        style={{ padding: "8px 14px", cursor: "pointer" }}
                                        onClick={() => setUrgency(u)}>
                                        {u.charAt(0) + u.slice(1).toLowerCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div style={{ font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Share with the receiver</div>
                            <div style={{ display: "grid", gap: "8px", font: "500 15px 'Figtree',sans-serif" }}>
                                {[
                                    { label: "Latest assessment note", value: shareAssessment, set: setShareAssessment },
                                    { label: "Current plan", value: sharePlan, set: setSharePlan },
                                    { label: "Message history", value: shareMessages, set: setShareMessages },
                                ].map(({ label, value, set }) => (
                                    <label key={label} style={{ display: "flex", gap: "10px", alignItems: "center", margin: 0, fontWeight: 500 }}>
                                        <input type="checkbox" checked={value} onChange={e => set(e.target.checked)} style={{ width: "20px", height: "20px", margin: 0 }} />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div style={{ padding: "12px", borderRadius: "10px", background: "#eef3f8", font: "400 14px/1.5 'Figtree',sans-serif" }} className="muted">
                            The patient will be asked to agree before anything is shared.
                        </div>
                        {sendError && <div style={{ color: "#8f1d1d", font: "400 13px 'Figtree',sans-serif" }}>{sendError}</div>}
                        <button type="submit" className="btn" disabled={sending}>{sending ? "Sending…" : "Send referral"}</button>
                    </form>
                </div>

                {/* Right column: in-progress + timeline */}
                <div style={{ flex: "1 1 420px", display: "grid", gap: "20px" }}>
                    {/* In progress list */}
                    <div className="card">
                        <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>In progress</h2>
                        {referrals.length === 0 ? (
                            <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif", marginTop: "12px" }}>No referrals yet.</div>
                        ) : referrals.map(r => (
                            <div key={r.id} className="row" style={{ marginTop: "8px", cursor: "pointer" }} onClick={() => setSelected(r)}>
                                <div style={{ flex: "1 1 180px" }}>
                                    <div style={{ font: "600 15px 'Figtree',sans-serif" }}>
                                        {r.patient.user.name} to {DISCIPLINE_LABELS[r.toDiscipline as keyof typeof DISCIPLINE_LABELS] ?? r.toDiscipline}
                                    </div>
                                    <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif" }}>
                                        {r.fromProfessionalId === meId ? "owner: you" : `from ${r.sender.user.name}`}
                                    </div>
                                </div>
                                <span className={`chip${STATUS_CHIP[r.status] ? ` ${STATUS_CHIP[r.status]}` : ""}`}>
                                    {STATUS_LABEL[r.status] ?? r.status}
                                </span>
                                {r.status === "PATIENT_CONSENTED" && r.fromProfessionalId !== meId && (
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button type="button" className="btn" style={{ minHeight: "32px", fontSize: "13px", padding: "0 12px" }}
                                            disabled={acting === r.id} onClick={e => { e.stopPropagation(); respond(r.id, "ACCEPTED"); }}>Accept</button>
                                        <button type="button" className="btn btn3" style={{ minHeight: "32px", fontSize: "13px", padding: "0 12px" }}
                                            disabled={acting === r.id} onClick={e => { e.stopPropagation(); respond(r.id, "DECLINED"); }}>Decline</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Timeline for selected */}
                    {selected && (
                        <div className="card">
                            <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>
                                {selected.patient.user.name} to {DISCIPLINE_LABELS[selected.toDiscipline as keyof typeof DISCIPLINE_LABELS] ?? selected.toDiscipline}
                            </h2>
                            <div style={{ display: "grid", gap: "14px", marginTop: "16px" }}>
                                {TIMELINE_STEPS.map((step, i) => {
                                    const cur = TL_STATUS_IDX[selected.status] ?? 0;
                                    const done = i <= cur;
                                    const isCur = i === cur + 1 && cur < TIMELINE_STEPS.length - 1;
                                    return (
                                        <div key={step} style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "500 15px 'Figtree',sans-serif" }}>
                                            <span className={`tldot${done ? " tldone" : isCur ? " tlcur" : ""}`}></span>
                                            <div style={!done && !isCur ? { color: "#4f6478" } : {}}>
                                                {step}
                                                {isCur && <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif" }}>Waiting. A reminder goes out if there is no reply in time.</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
