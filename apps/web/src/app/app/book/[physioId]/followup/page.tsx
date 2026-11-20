"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const FOLLOW_UP_NAIRA = 5_000;
const SERVICE_FEE_BPS = 500;
const SERVICE_FEE_CAP_NAIRA = 500;

function calcServiceFee(priceNaira: number) {
    return Math.min(Math.round((priceNaira * SERVICE_FEE_BPS) / 10_000), SERVICE_FEE_CAP_NAIRA);
}

type Slot = { startsAt: string; durationMinutes: number; mode: "VIDEO" | "HOME" | "CHAT" | "ANY" };
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

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
    return new Date(iso).toLocaleDateString("en-NG", opts);
}

export default function FollowUpBookPage() {
    const router = useRouter();
    const params = useParams<{ physioId: string }>();
    const [slots, setSlots] = useState<Slot[]>([]);
    const [pro, setPro] = useState<Pro | null>(null);
    const [sessionType, setSessionType] = useState<"VIDEO" | "HOME" | "CHAT">("VIDEO");
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            fetch(`/api/proxy/booking/slots/${params.physioId}`).then(r => r.json()),
            fetch(`/api/proxy/physios/${params.physioId}`).then(r => r.ok ? r.json() : null),
        ])
            .then(([slotsData, proData]) => {
                const all: Slot[] = slotsData ?? [];
                setSlots(all);
                setPro(proData);
                if (all.length > 0) {
                    const firstDay = new Date(all[0]!.startsAt).toISOString().slice(0, 10);
                    setSelectedDay(firstDay);
                    const firstMode = all[0]!.mode;
                    if (firstMode !== "ANY") setSessionType(firstMode);
                }
            })
            .catch(e => setError((e as Error).message));
    }, [params.physioId]);

    const filtered = slots.filter(s => s.mode === sessionType || s.mode === "ANY");
    const byDay = filtered.reduce<Record<string, Slot[]>>((acc, s) => {
        const day = new Date(s.startsAt).toISOString().slice(0, 10);
        if (!acc[day]) acc[day] = [];
        acc[day].push(s);
        return acc;
    }, {});
    const days = Object.keys(byDay).sort().slice(0, 7);
    const timesForDay = selectedDay ? (byDay[selectedDay] ?? []) : [];
    const selectedSlot = timesForDay.find(s => s.startsAt === selectedTime) ?? null;

    const availableModes = Array.from(new Set(
        slots.flatMap(s => s.mode === "ANY" ? ["VIDEO", "HOME", "CHAT"] : [s.mode])
    )) as ("VIDEO" | "HOME" | "CHAT")[];
    const hasMultipleModes = availableModes.length > 1;

    const fee = FOLLOW_UP_NAIRA;
    const serviceFee = calcServiceFee(fee);
    const total = fee + serviceFee;

    async function onPay() {
        if (!selectedTime) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/proxy/booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    physioId: params.physioId,
                    type: "FOLLOW_UP",
                    mode: sessionType,
                    startsAt: selectedTime,
                    durationMinutes: selectedSlot?.durationMinutes ?? 30,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message ?? "Something went wrong. Please try again.");
            }
            const { authorizationUrl } = await res.json();
            window.location.href = authorizationUrl;
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    const NAV = "#022449";
    const MUTED = "#4f6478";
    const BORDER = "#d9e3ec";

    return (
        <div style={{ maxWidth: "430px", margin: "0 auto", padding: "28px 20px", fontFamily: "'Figtree',system-ui,sans-serif", minHeight: "100dvh", display: "flex", flexDirection: "column", gap: "14px", background: "#f4f8fb", color: NAV }}>
            <button type="button" onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, font: "600 14px 'Figtree',sans-serif", padding: 0, alignSelf: "flex-start" }}>
                ← Back
            </button>

            <h1 style={{ font: "700 26px 'Figtree',sans-serif", margin: 0 }}>Book a follow-up</h1>

            {/* Professional card */}
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#cfe3ee", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", font: "700 20px 'Figtree',sans-serif", color: "#07506b" }}>
                    {pro?.photoUrl
                        ? <img src={pro.photoUrl} alt={pro.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : (pro?.user.name?.charAt(0).toUpperCase() ?? "?")}
                </div>
                <div>
                    <div style={{ font: "700 16px 'Figtree',sans-serif" }}>{pro?.user.name ?? "Loading…"}</div>
                    <div style={{ font: "400 14px 'Figtree',sans-serif", color: MUTED }}>
                        {pro ? (DISCIPLINE_LABELS[pro.discipline] ?? pro.discipline) : ""}
                    </div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                    <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 99, font: "600 12px 'Figtree',sans-serif", background: "#e3f8e3", color: "#1b7d0e" }}>
                        Follow-up
                    </span>
                </div>
            </div>

            {/* Session type */}
            {hasMultipleModes && (
                <div>
                    <div style={{ font: "600 14px 'Figtree',sans-serif", marginBottom: 8 }}>How would you like your session?</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {availableModes.includes("VIDEO") && (
                            <button type="button" className={`slot${sessionType === "VIDEO" ? " on" : ""}`} onClick={() => { setSessionType("VIDEO"); setSelectedDay(null); setSelectedTime(null); }}>Video call</button>
                        )}
                        {availableModes.includes("CHAT") && (
                            <button type="button" className={`slot${sessionType === "CHAT" ? " on" : ""}`} onClick={() => { setSessionType("CHAT"); setSelectedDay(null); setSelectedTime(null); }}>Chat</button>
                        )}
                        {availableModes.includes("HOME") && (
                            <button type="button" className={`slot${sessionType === "HOME" ? " on" : ""}`} onClick={() => { setSessionType("HOME"); setSelectedDay(null); setSelectedTime(null); }}>In-person visit</button>
                        )}
                    </div>
                </div>
            )}

            {/* Day picker */}
            {days.length > 0 ? (
                <>
                    <div>
                        <div style={{ font: "600 14px 'Figtree',sans-serif", marginBottom: 8 }}>Choose a day</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {days.map(day => (
                                <button key={day} type="button" className={`slot${selectedDay === day ? " on" : ""}`}
                                    onClick={() => { setSelectedDay(day); setSelectedTime(null); }}>
                                    {fmt(day + "T12:00:00", { weekday: "short", day: "numeric" })}
                                </button>
                            ))}
                        </div>
                    </div>

                    {timesForDay.length > 0 && (
                        <div>
                            <div style={{ font: "600 14px 'Figtree',sans-serif", marginBottom: 8 }}>Choose a time</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {timesForDay.map(s => {
                                    const label = new Date(s.startsAt).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
                                    return (
                                        <button key={s.startsAt} type="button" className={`slot${selectedTime === s.startsAt ? " on" : ""}`}
                                            onClick={() => setSelectedTime(s.startsAt)}>
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, color: MUTED, font: "400 15px 'Figtree',sans-serif" }}>
                    No available slots in the next 14 days.
                </div>
            )}

            {/* Price breakdown */}
            {selectedTime && (
                <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, display: "grid", gap: 8, font: "500 15px 'Figtree',sans-serif" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Follow-up session</span><span>₦{fee.toLocaleString("en-NG")}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Service fee</span><span>₦{serviceFee.toLocaleString("en-NG")}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: `1px solid ${BORDER}`, paddingTop: 8 }}><span>Total</span><span>₦{total.toLocaleString("en-NG")}</span></div>
                </div>
            )}

            {/* Package upsell */}
            {selectedTime && (
                <div style={{ background: "#f0f4ff", border: "1px solid #c3d0f0", borderRadius: 14, padding: 14 }}>
                    <div style={{ font: "600 14px 'Figtree',sans-serif", color: NAV }}>Save with a package</div>
                    <div style={{ font: "400 13px 'Figtree',sans-serif", color: MUTED, margin: "4px 0 10px" }}>
                        Buy 3, 5 or 10 consecutive sessions at ₦5,000 each — no extra service fee per session.
                    </div>
                    <a
                        href={`/app/packages/${params.physioId}`}
                        style={{ font: "600 13px 'Figtree',sans-serif", color: "#1340a8", textDecoration: "none" }}
                    >
                        View packages →
                    </a>
                </div>
            )}

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
                    disabled={!selectedTime || loading}
                    onClick={onPay}
                >
                    {loading ? "Processing…" : "Pay and book"}
                </button>
            </div>
        </div>
    );
}
