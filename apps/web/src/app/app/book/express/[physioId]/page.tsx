"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const FIRST_CONSULT_NAIRA = 10_000;
const SERVICE_FEE_BPS = 500;
const SERVICE_FEE_CAP_NAIRA = 500;

function calcServiceFee(priceNaira: number) {
    return Math.min(Math.round((priceNaira * SERVICE_FEE_BPS) / 10_000), SERVICE_FEE_CAP_NAIRA);
}

const serviceFee = calcServiceFee(FIRST_CONSULT_NAIRA);
const total = FIRST_CONSULT_NAIRA + serviceFee;

const DISCIPLINE_LABELS: Record<string, string> = {
    PHYSIOTHERAPY: "Physiotherapist",
    OCCUPATIONAL_THERAPY: "Occupational therapist",
    SPEECH_LANGUAGE_PATHOLOGY: "Speech therapist",
    PROSTHETICS_ORTHOTICS: "Prosthetist / orthotist",
    AUDIOLOGY: "Audiologist",
    CHIROPRACTIC: "Chiropractor",
    DIETETICS: "Dietitian",
    PSYCHOLOGY: "Psychologist",
    SPORTS_MEDICINE: "Sports medicine",
    MASSAGE_THERAPY: "Massage therapist",
};

type Pro = {
    userId: string;
    user: { name: string };
    discipline: string;
    photoUrl: string | null;
};

export default function ExpressBookPage() {
    const params = useParams<{ physioId: string }>();
    const router = useRouter();

    const [pro, setPro] = useState<Pro | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/proxy/physios/${params.physioId}`)
            .then(r => r.ok ? r.json() : null)
            .then(setPro)
            .catch(() => {});
    }, [params.physioId]);

    async function pay() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/proxy/booking/express", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ physioId: params.physioId }),
            });
            const body = await res.json() as { appointmentId?: string; authorizationUrl?: string | null; message?: string; code?: string };
            if (!res.ok) {
                const msg = body.code === "PROFILE_INCOMPLETE"
                    ? "Please complete your patient profile before booking."
                    : (body.message ?? "Something went wrong. Please try again.");
                setError(msg);
                return;
            }
            if (body.authorizationUrl) {
                window.location.href = body.authorizationUrl;
            } else {
                router.replace(`/app/appointments/${body.appointmentId}`);
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "32px 20px", fontFamily: "'Figtree',system-ui,sans-serif", color: "#022449" }}>
            <a href="/professionals" style={{ font: "500 14px 'Figtree',sans-serif", color: "#4f6478", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
                ← Back
            </a>

            <h1 style={{ font: "700 24px 'Figtree',sans-serif", margin: "0 0 6px" }}>Express session</h1>
            <p style={{ font: "400 14px 'Figtree',sans-serif", color: "#4f6478", margin: "0 0 24px" }}>
                Pay now and join immediately — no scheduling needed.
            </p>

            {/* Pro info */}
            <div style={{ background: "#fff", border: "1px solid #dce7f0", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#cfe3ee", flexShrink: 0 }} />
                <div>
                    <div style={{ font: "700 16px 'Figtree',sans-serif" }}>{pro?.user.name ?? "Loading…"}</div>
                    <div style={{ font: "400 13px 'Figtree',sans-serif", color: "#4f6478", marginTop: 2 }}>
                        {pro ? (DISCIPLINE_LABELS[pro.discipline] ?? pro.discipline) : ""}
                    </div>
                </div>
            </div>

            {/* Session details */}
            <div style={{ background: "#fff", border: "1px solid #dce7f0", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
                <div style={{ font: "600 13px 'Figtree',sans-serif", color: "#4f6478", marginBottom: 12 }}>SESSION DETAILS</div>
                <div style={{ display: "flex", justifyContent: "space-between", font: "400 14px 'Figtree',sans-serif", marginBottom: 8 }}>
                    <span>Type</span><span style={{ font: "500 14px 'Figtree',sans-serif" }}>Video call · starts immediately</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", font: "400 14px 'Figtree',sans-serif", marginBottom: 8 }}>
                    <span>Duration</span><span style={{ font: "500 14px 'Figtree',sans-serif" }}>Up to 90 minutes</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", font: "400 14px 'Figtree',sans-serif", marginBottom: 8 }}>
                    <span>Consultation fee</span><span style={{ font: "500 14px 'Figtree',sans-serif" }}>₦{FIRST_CONSULT_NAIRA.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", font: "400 14px 'Figtree',sans-serif", paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid #edf2f7" }}>
                    <span>Service fee</span><span style={{ font: "500 14px 'Figtree',sans-serif" }}>₦{serviceFee.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", font: "700 16px 'Figtree',sans-serif" }}>
                    <span>Total</span><span>₦{total.toLocaleString()}</span>
                </div>
            </div>

            {error && (
                <div style={{ padding: "10px 14px", background: "#fee2e2", borderRadius: 10, font: "400 13px 'Figtree',sans-serif", color: "#7f1d1d", marginBottom: 16 }}>
                    {error}
                </div>
            )}

            <button
                onClick={pay}
                disabled={loading || !pro}
                style={{
                    width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
                    background: loading || !pro ? "#9db8a0" : "#1b7d0e",
                    color: "#fff", font: "600 16px 'Figtree',sans-serif",
                    cursor: loading || !pro ? "not-allowed" : "pointer",
                }}
            >
                {loading ? "Processing…" : `Pay ₦${total.toLocaleString()} & Join`}
            </button>

            <p style={{ font: "400 12px 'Figtree',sans-serif", color: "#7a8fa6", textAlign: "center", marginTop: 14 }}>
                You have 15 minutes to join after payment. The professional will be notified.
            </p>
        </div>
    );
}
