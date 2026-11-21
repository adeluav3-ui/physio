"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const SESSION_PRICE_NAIRA = 5_000;

const PACKAGES = [
    { size: 3 as const, label: "Starter", sessions: 3, totalNaira: 3 * SESSION_PRICE_NAIRA },
    { size: 5 as const, label: "Popular", sessions: 5, totalNaira: 5 * SESSION_PRICE_NAIRA },
    { size: 10 as const, label: "Best value", sessions: 10, totalNaira: 10 * SESSION_PRICE_NAIRA },
] as const;

type Pro = {
    userId: string;
    user: { name: string };
    discipline: string;
    photoUrl: string | null;
};

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

export default function PackagesBuyPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const physioId = params.id;
    const [pro, setPro] = useState<Pro | null>(null);
    const [selected, setSelected] = useState<3 | 5 | 10>(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/proxy/physios/${physioId}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => setPro(data))
            .catch(() => null);
    }, [physioId]);

    async function onCheckout() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/proxy/packages/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ physioId, size: selected }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message ?? "Could not start checkout. Please try again.");
            }
            const { authorizationUrl, packageId } = await res.json();
            if (authorizationUrl) {
                window.location.href = authorizationUrl;
            } else {
                router.replace(`/app/packages/${packageId}`);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    const pkg = PACKAGES.find(p => p.size === selected)!;

    const NAV = "#022449";
    const MUTED = "#4f6478";
    const BORDER = "#d9e3ec";
    const GREEN = "#1b7d0e";

    return (
        <div style={{ maxWidth: "430px", margin: "0 auto", padding: "28px 20px", fontFamily: "'Figtree',system-ui,sans-serif", minHeight: "100dvh", display: "flex", flexDirection: "column", gap: "14px", background: "#f4f8fb", color: NAV }}>
            <button type="button" onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, font: "600 14px 'Figtree',sans-serif", padding: 0, alignSelf: "flex-start" }}>
                ← Back
            </button>

            <div>
                <h1 style={{ font: "700 26px 'Figtree',sans-serif", margin: "0 0 4px" }}>Session packages</h1>
                <p style={{ font: "400 15px 'Figtree',sans-serif", color: MUTED, margin: 0 }}>
                    Buy follow-up sessions at ₦{SESSION_PRICE_NAIRA.toLocaleString("en-NG")} each. Valid for 90 days.
                </p>
            </div>

            {pro && (
                <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#cfe3ee", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", font: "700 16px 'Figtree',sans-serif", color: "#07506b" }}>
                        {pro.photoUrl
                            ? <img src={pro.photoUrl} alt={pro.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : pro.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ font: "600 15px 'Figtree',sans-serif" }}>{pro.user.name}</div>
                        <div style={{ font: "400 13px 'Figtree',sans-serif", color: MUTED }}>{DISCIPLINE_LABELS[pro.discipline] ?? pro.discipline}</div>
                    </div>
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {PACKAGES.map(p => {
                    const isSelected = p.size === selected;
                    return (
                        <button
                            key={p.size}
                            type="button"
                            onClick={() => setSelected(p.size)}
                            style={{
                                background: isSelected ? NAV : "#fff",
                                border: `2px solid ${isSelected ? NAV : BORDER}`,
                                borderRadius: 16,
                                padding: "16px 18px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: "pointer",
                                textAlign: "left",
                            }}
                        >
                            <div>
                                <div style={{ font: "700 16px 'Figtree',sans-serif", color: isSelected ? "#fff" : NAV }}>
                                    {p.sessions} sessions
                                    <span style={{ font: "500 13px 'Figtree',sans-serif", marginLeft: 8, color: isSelected ? "#9fc1e0" : MUTED }}>
                                        {p.label}
                                    </span>
                                </div>
                                <div style={{ font: "400 13px 'Figtree',sans-serif", color: isSelected ? "#c9d9ec" : MUTED, marginTop: 2 }}>
                                    ₦{SESSION_PRICE_NAIRA.toLocaleString("en-NG")} / session · valid 90 days
                                </div>
                            </div>
                            <div style={{ font: "700 18px 'Figtree',sans-serif", color: isSelected ? "#fff" : NAV, flexShrink: 0, marginLeft: 12 }}>
                                ₦{p.totalNaira.toLocaleString("en-NG")}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, font: "500 15px 'Figtree',sans-serif", display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{pkg.sessions} × follow-up sessions</span>
                    <span>₦{pkg.totalNaira.toLocaleString("en-NG")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: GREEN }}>Expiry</span>
                    <span style={{ color: GREEN }}>90 days from purchase</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: `1px solid ${BORDER}`, paddingTop: 8 }}>
                    <span>Total</span>
                    <span>₦{pkg.totalNaira.toLocaleString("en-NG")}</span>
                </div>
            </div>

            <div style={{ background: "#f0f8f0", border: "1px solid #c3dfc3", borderRadius: 12, padding: "10px 14px", font: "400 13px 'Figtree',sans-serif", color: "#1b5c0e" }}>
                Each session is redeemed by your specialist at the start of your appointment. Sessions are non-refundable once redeemed.
            </div>

            {error && (
                <div style={{ background: "#fde8e8", border: "1px solid #f3b4b4", borderRadius: 12, padding: 14, color: "#8f1d1d", font: "400 14px 'Figtree',sans-serif" }}>
                    {error}
                </div>
            )}

            <div style={{ marginTop: "auto" }}>
                <button
                    type="button"
                    className="btn"
                    style={{ width: "100%", display: "flex", minHeight: 50 }}
                    disabled={loading}
                    onClick={onCheckout}
                >
                    {loading ? "Processing…" : `Pay ₦${pkg.totalNaira.toLocaleString("en-NG")}`}
                </button>
            </div>
        </div>
    );
}
