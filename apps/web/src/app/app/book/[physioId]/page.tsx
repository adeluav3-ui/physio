"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

// Platform-fixed prices (from policy.ts)
const FIRST_CONSULT_NAIRA = 10_000;
const SERVICE_FEE_BPS = 500; // 5%, capped ₦500
const SERVICE_FEE_CAP_NAIRA = 500;

function calcServiceFee(priceNaira: number) {
    return Math.min(Math.round((priceNaira * SERVICE_FEE_BPS) / 10_000), SERVICE_FEE_CAP_NAIRA);
}

type Slot = { startsAt: string; durationMinutes: number; mode: "VIDEO" | "HOME" | "CHAT" | "ANY" };
type TriageLevel = "GREEN" | "AMBER" | "RED";
type LatestIntake = { id: string; triage: { level: TriageLevel } | null } | null;
type Pro = {
    userId: string;
    user: { name: string };
    rateKobo: number;
    discipline: string;
    photoUrl: string | null;
    licenceStatus: string;
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

function userFriendlyError(code: string | undefined): string {
    switch (code) {
        case "INTAKE_REQUIRED": return "You need to complete a health intake before booking.";
        case "PROFILE_INCOMPLETE": return "Please complete your patient profile before booking.";
        case "SLOT_CONFLICT": return "That slot was just taken. Please pick another time.";
        default: return "Something went wrong. Please try again.";
    }
}

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
    return new Date(iso).toLocaleDateString("en-NG", opts);
}

export default function BookPage() {
    const router = useRouter();
    const params = useParams<{ physioId: string }>();
    const [slots, setSlots] = useState<Slot[]>([]);
    const [pro, setPro] = useState<Pro | null>(null);
    const [intake, setIntake] = useState<LatestIntake | undefined>(undefined);
    const [sessionType, setSessionType] = useState<"VIDEO" | "CHAT">("VIDEO");
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            fetch(`/api/proxy/booking/slots/${params.physioId}`).then(r => r.json()),
            fetch("/api/proxy/triage/latest").then(r => r.ok ? r.json() : null),
            fetch(`/api/proxy/physios/${params.physioId}`).then(r => r.ok ? r.json() : null),
        ])
            .then(([slotsData, intakeData, proData]) => {
                const all: Slot[] = slotsData ?? [];
                setSlots(all);
                setIntake(intakeData);
                setPro(proData);
                if (all.length > 0) {
                    const firstDay = new Date(all[0]!.startsAt).toISOString().slice(0, 10);
                    setSelectedDay(firstDay);
                    // Auto-select the first available mode
                    const firstMode = all[0]!.mode;
                    if (firstMode !== "ANY" && firstMode !== "HOME") setSessionType(firstMode);
                }
            })
            .catch(e => setError((e as Error).message));
    }, [params.physioId]);

    useEffect(() => {
        if (intake === null) router.replace("/app/intake/complaint");
    }, [intake, router]);

    /* Group slots by day, filtered by session type (ANY slots appear under all tabs) */
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
        slots.flatMap(s => s.mode === "ANY" ? ["VIDEO", "CHAT"] : s.mode !== "HOME" ? [s.mode] : [])
    )) as ("VIDEO" | "CHAT")[];
    const hasMultipleModes = availableModes.length > 1;

    // This page always books an ASSESSMENT (first consult) → ₦10,000
    const fee = FIRST_CONSULT_NAIRA;
    const serviceFee = calcServiceFee(fee);
    const total = fee + serviceFee;

    async function onPay() {
        if (!selectedTime || !intake) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/proxy/booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    physioId: params.physioId,
                    intakeId: intake.id,
                    type: "ASSESSMENT",
                    mode: sessionType,
                    startsAt: selectedTime,
                    durationMinutes: selectedSlot?.durationMinutes ?? 45,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                const code: string | undefined = body.code;
                if (code === "INTAKE_REQUIRED") { router.push("/app/intake/complaint"); return; }
                throw new Error(userFriendlyError(code));
            }
            const { authorizationUrl, appointmentId } = await res.json();
            if (authorizationUrl) {
                window.location.href = authorizationUrl;
            } else {
                router.replace(`/app/appointments/${appointmentId}`);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    /* RED triage */
    if (intake?.triage?.level === "RED") {
        return (
            <div style={{ maxWidth: "430px", margin: "0 auto", padding: "28px 20px", fontFamily: "'Figtree',system-ui,sans-serif", minHeight: "100dvh", display: "flex", flexDirection: "column", gap: "14px", background: "#f4f8fb", color: "#022449" }}>
                <div className="card" style={{ background: "#fde8e8", borderColor: "#f3b4b4" }}>
                    <div style={{ font: "700 17px 'Figtree',sans-serif", color: "#8f1d1d" }}>Urgent care recommended</div>
                    <p style={{ font: "400 15px/1.5 'Figtree',sans-serif", color: "#8f1d1d", marginTop: "8px" }}>
                        Your symptoms need urgent in-person evaluation. Online booking is not available.
                        Please visit your nearest A&amp;E or call your GP immediately.
                    </p>
                    <p style={{ font: "500 14px 'Figtree',sans-serif", color: "#8f1d1d", marginTop: "6px" }}>
                        Emergency? Call <strong>112</strong> now.
                    </p>
                </div>
                <button type="button" className="btn btn2" onClick={() => router.back()}>Go back</button>
            </div>
        );
    }

    if (intake === undefined) {
        return (
            <div style={{ maxWidth: "430px", margin: "0 auto", padding: "28px 20px", fontFamily: "'Figtree',system-ui,sans-serif", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f8fb" }}>
                <div className="muted" style={{ font: "400 15px 'Figtree',sans-serif" }}>Loading…</div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "430px", margin: "0 auto", padding: "28px 20px", fontFamily: "'Figtree',system-ui,sans-serif", minHeight: "100dvh", display: "flex", flexDirection: "column", gap: "14px", background: "#f4f8fb", color: "#022449" }}>
            <h1 style={{ font: "700 26px 'Figtree',sans-serif", margin: 0 }}>Book a session</h1>

            {intake?.triage?.level === "AMBER" && (
                <div className="card" style={{ background: "#fdf1d8", borderColor: "#ecd49b", color: "#5f3f00", font: "400 14px/1.5 'Figtree',sans-serif" }}>
                    Your health assessment flagged some concerns. Your specialist will discuss options after booking.
                </div>
            )}

            {/* Professional card */}
            <div className="card" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#cfe3ee", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", font: "700 20px 'Figtree',sans-serif", color: "#07506b" }}>
                    {pro?.photoUrl
                        ? <img src={pro.photoUrl} alt={pro.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : (pro?.user.name?.charAt(0).toUpperCase() ?? "?")}
                </div>
                <div>
                    <div style={{ font: "700 16px 'Figtree',sans-serif" }}>{pro?.user.name ?? "Loading…"}</div>
                    <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif" }}>
                        {pro ? `${DISCIPLINE_LABELS[pro.discipline] ?? pro.discipline} · Licence verified` : ""}
                    </div>
                </div>
            </div>

            {/* Session type */}
            {hasMultipleModes && (
                <div>
                    <div style={{ font: "600 14px 'Figtree',sans-serif", marginBottom: "8px" }}>How would you like your session?</div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {availableModes.includes("VIDEO") && (
                            <button type="button" className={`slot${sessionType === "VIDEO" ? " on" : ""}`} onClick={() => { setSessionType("VIDEO"); setSelectedDay(null); setSelectedTime(null); }}>Video call</button>
                        )}
                        {availableModes.includes("CHAT") && (
                            <button type="button" className={`slot${sessionType === "CHAT" ? " on" : ""}`} onClick={() => { setSessionType("CHAT"); setSelectedDay(null); setSelectedTime(null); }}>Chat</button>
                        )}
                    </div>
                </div>
            )}

            {/* Day picker */}
            {days.length > 0 ? (
                <>
                    <div>
                        <div style={{ font: "600 14px 'Figtree',sans-serif", marginBottom: "8px" }}>Choose a day</div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {days.map(day => (
                                <button key={day} type="button" className={`slot${selectedDay === day ? " on" : ""}`}
                                    onClick={() => { setSelectedDay(day); setSelectedTime(null); }}>
                                    {fmt(day + "T12:00:00", { weekday: "short", day: "numeric" })}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time picker */}
                    {timesForDay.length > 0 && (
                        <div>
                            <div style={{ font: "600 14px 'Figtree',sans-serif", marginBottom: "8px" }}>Choose a time</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
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
                <div className="card" style={{ color: "#4f6478", font: "400 15px 'Figtree',sans-serif" }}>
                    No available slots in the next 14 days.
                </div>
            )}

            {/* Price breakdown */}
            {selectedTime && (
                <div className="card" style={{ display: "grid", gap: "8px", font: "500 15px 'Figtree',sans-serif" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>First consultation</span><span>₦{fee.toLocaleString("en-NG")}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Service fee</span><span>₦{serviceFee.toLocaleString("en-NG")}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid #e6eeec", paddingTop: "8px" }}><span>Total</span><span>₦{total.toLocaleString("en-NG")}</span></div>
                </div>
            )}

            {error && <div className="card" style={{ background: "#fde8e8", borderColor: "#f3b4b4", color: "#8f1d1d", font: "400 14px 'Figtree',sans-serif" }}>{error}</div>}

            <div style={{ marginTop: "auto" }}>
                <button type="button" className="btn" style={{ width: "100%", display: "flex", minHeight: "50px" }}
                    disabled={!selectedTime || loading} onClick={onPay}>
                    {loading ? "Processing…" : "Pay and book"}
                </button>
            </div>
        </div>
    );
}
