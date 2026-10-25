"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { physioApplySchema, DISCIPLINE_LABELS } from "@physio/shared";

type Discipline = keyof typeof DISCIPLINE_LABELS;
const DISCIPLINES = Object.entries(DISCIPLINE_LABELS) as [Discipline, string][];
const VALID_DISCIPLINES = DISCIPLINES.map(([k]) => k);

const STEPS = [
    "Account and discipline",
    "Licence",
    "Profile",
    "Availability",
    "Payout details",
    "Submit for verification",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ProfessionalApplyPage() {
    const router = useRouter();
    const params = useSearchParams();
    const urlDiscipline = params.get("discipline") as Discipline | null;
    const [checking, setChecking] = useState(true);
    const [step, setStep] = useState(0);

    /* Step 1 — pre-filled from signup if discipline was selected there */
    const [discipline, setDiscipline] = useState<Discipline>(
        urlDiscipline && VALID_DISCIPLINES.includes(urlDiscipline) ? urlDiscipline : "PHYSIOTHERAPY"
    );

    /* Step 2 */
    const [licenceNo, setLicenceNo] = useState("");

    /* Step 3 */
    const [specialties, setSpecialties] = useState("");
    const [bio, setBio] = useState("");
    const [rate, setRate] = useState("");
    const [serviceArea, setServiceArea] = useState("");

    /* Step 4 */
    const [sessionLen, setSessionLen] = useState("45");
    const [breakLen, setBreakLen] = useState("15");
    const [sessionTypes, setSessionTypes] = useState("Video");

    type DaySlot = { enabled: boolean; start: string; end: string };
    const [avail, setAvail] = useState<Record<string, DaySlot>>(() =>
        Object.fromEntries(DAYS.map(d => [d, { enabled: false, start: "09:00", end: "17:00" }]))
    );

    function toggleDay(day: string) {
        setAvail(prev => ({ ...prev, [day]: { ...prev[day]!, enabled: !prev[day]!.enabled } }));
    }
    function setDayTime(day: string, field: "start" | "end", value: string) {
        setAvail(prev => ({ ...prev, [day]: { ...prev[day]!, [field]: value } }));
    }

    /* Step 5 */
    const [bankName, setBankName] = useState("");
    const [accountNo, setAccountNo] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch("/api/proxy/auth/me")
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then(user => {
                if (user.role !== "PHYSIO" && user.role !== "PATIENT") throw new Error();
                setChecking(false);
            })
            .catch(() => { window.location.href = "/auth/login?next=/pro/onboarding/apply"; });
    }, []);

    async function submit() {
        setError(null);
        const parsed = physioApplySchema.safeParse({
            discipline,
            licenceNo,
            specialties: specialties.split(",").map(s => s.trim()).filter(Boolean),
            bio,
            rate: Math.round(Number(rate) * 100),
            serviceArea,
        });
        if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Please check your inputs"); return; }
        setLoading(true);
        try {
            const res = await fetch("/api/proxy/physios/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed.data),
            });
            if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.message ?? "Application failed"); }
            router.push("/pro/onboarding/pending");
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    const progress = Math.round(((step) / STEPS.length) * 100);

    if (checking) {
        return (
            <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree',system-ui,sans-serif", background: "#f6f8f7" }}>
                <div className="muted" style={{ font: "400 15px 'Figtree',sans-serif" }}>Loading…</div>
            </div>
        );
    }

    return (
        <div style={{ width: "100%", padding: "24px", fontFamily: "'Figtree',system-ui,sans-serif", color: "#12302c", background: "#f6f8f7", minHeight: "100dvh" }}>
            <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                    <div style={{ font: "700 22px 'Figtree',sans-serif", color: "#1b766e" }}>Rehab360</div>
                    <span className="chip warn">Not yet visible to patients</span>
                </div>
                <h1 style={{ font: "700 32px 'Figtree',sans-serif", marginTop: "24px" }}>Set up your practice</h1>
                <p className="muted" style={{ font: "400 16px 'Figtree',sans-serif", marginTop: "6px" }}>Finish all steps, then submit for verification. This takes about 15 minutes.</p>
                <div style={{ height: "8px", borderRadius: "99px", background: "#dbe5e2", marginTop: "18px", maxWidth: "520px" }}>
                    <div style={{ width: `${progress}%`, height: "8px", borderRadius: "99px", background: "#1b766e", transition: "width .3s" }}></div>
                </div>
                <div className="muted" style={{ font: "600 13px 'Figtree',sans-serif", marginTop: "6px" }}>{step} of {STEPS.length} steps done</div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginTop: "24px", alignItems: "flex-start" }}>
                    {/* Checklist sidebar */}
                    <div style={{ flex: "0 1 300px", display: "grid", gap: "6px" }}>
                        {STEPS.map((s, i) => {
                            const done = i < step;
                            const cur = i === step;
                            return (
                                <div key={s} className="step" style={cur ? { background: "#e3f1ef", fontWeight: 600 } : {}}>
                                    <span className="dot" style={done ? { background: "#1b766e", borderColor: "#1b766e", color: "#fff" } : cur ? { borderColor: "#1b766e", color: "#1b766e" } : {}}>
                                        {done ? "✓" : i + 1}
                                    </span>
                                    {s}
                                </div>
                            );
                        })}
                    </div>

                    {/* Step content */}
                    <div className="card" style={{ flex: "999 1 560px", minWidth: 0 }}>
                        {step === 0 && (
                            <>
                                <h2 style={{ font: "700 24px 'Figtree',sans-serif" }}>Account and discipline</h2>
                                <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>Select your primary rehabilitation discipline.</p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px" }}>
                                    {DISCIPLINES.map(([key, label]) => (
                                        <button key={key} type="button"
                                            className={`slot${discipline === key ? " on" : ""}`}
                                            onClick={() => setDiscipline(key)}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {step === 1 && (
                            <>
                                <h2 style={{ font: "700 24px 'Figtree',sans-serif" }}>Licence</h2>
                                <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>We verify every licence with the relevant regulatory body.</p>
                                <div style={{ marginTop: "20px", display: "grid", gap: "16px" }}>
                                    <div>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Licence / registration number</label>
                                        <input className="in" value={licenceNo} onChange={e => setLicenceNo(e.target.value)} placeholder="As it appears on your regulatory board certificate" />
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <h2 style={{ font: "700 24px 'Figtree',sans-serif" }}>Profile</h2>
                                <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>This is what patients see when they search for a specialist.</p>
                                <div style={{ marginTop: "20px", display: "grid", gap: "16px" }}>
                                    <div>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Specialties</label>
                                        <input className="in" value={specialties} onChange={e => setSpecialties(e.target.value)} placeholder="Comma-separated, e.g. Paediatrics, Neuro, Post-op" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Short bio</label>
                                        <textarea className="in" value={bio} onChange={e => setBio(e.target.value)} placeholder="Your experience and approach to care (min. 50 characters)" style={{ minHeight: "100px", padding: "10px 12px", resize: "vertical" }} />
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                                        <div style={{ flex: "1 1 200px" }}>
                                            <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Session rate (NGN)</label>
                                            <input className="in" type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="What patients pay per session" />
                                        </div>
                                        <div style={{ flex: "1 1 200px" }}>
                                            <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Service area</label>
                                            <input className="in" value={serviceArea} onChange={e => setServiceArea(e.target.value)} placeholder="City or region" />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <h2 style={{ font: "700 24px 'Figtree',sans-serif" }}>Your weekly availability</h2>
                                <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>Patients can only book inside these hours. You can change them any time.</p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "20px" }}>
                                    <div style={{ flex: "1 1 200px" }}>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Session length</label>
                                        <input className="in" value={sessionLen} onChange={e => setSessionLen(e.target.value)} placeholder="45 minutes" />
                                    </div>
                                    <div style={{ flex: "1 1 200px" }}>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Break between sessions</label>
                                        <input className="in" value={breakLen} onChange={e => setBreakLen(e.target.value)} placeholder="15 minutes" />
                                    </div>
                                    <div style={{ flex: "1 1 200px" }}>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Session types</label>
                                        <input className="in" value={sessionTypes} onChange={e => setSessionTypes(e.target.value)} placeholder="Video, home visit" />
                                    </div>
                                </div>
                                <div style={{ marginTop: "24px", display: "grid", gap: "10px" }}>
                                    {DAYS.map(day => {
                                        const slot = avail[day]!;
                                        return (
                                            <div key={day} style={{ padding: "12px 14px", border: `1px solid ${slot.enabled ? "#1b766e" : "#dbe5e2"}`, borderRadius: "12px", background: slot.enabled ? "#f1f9f7" : "#fff" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <span style={{ width: "100px", font: "600 15px 'Figtree',sans-serif" }}>{day}</span>
                                                    {!slot.enabled && (
                                                        <span className="muted" style={{ font: "400 14px 'Figtree',sans-serif" }}>Not available</span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleDay(day)}
                                                        style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", font: "600 14px 'Figtree',sans-serif", color: slot.enabled ? "#8f1d1d" : "#1b766e", padding: 0 }}
                                                    >
                                                        {slot.enabled ? "Remove" : "Add hours"}
                                                    </button>
                                                </div>
                                                {slot.enabled && (
                                                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "12px", marginTop: "10px", alignItems: "center" }}>
                                                        <div>
                                                            <label style={{ display: "block", font: "600 12px 'Figtree',sans-serif", marginBottom: "4px", color: "#4f6663" }}>From</label>
                                                            <input type="time" className="in" value={slot.start} onChange={e => setDayTime(day, "start", e.target.value)} style={{ minHeight: "38px", width: "120px" }} />
                                                        </div>
                                                        <div>
                                                            <label style={{ display: "block", font: "600 12px 'Figtree',sans-serif", marginBottom: "4px", color: "#4f6663" }}>To</label>
                                                            <input type="time" className="in" value={slot.end} onChange={e => setDayTime(day, "end", e.target.value)} style={{ minHeight: "38px", width: "120px" }} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {step === 4 && (
                            <>
                                <h2 style={{ font: "700 24px 'Figtree',sans-serif" }}>Payout details</h2>
                                <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>Session fees are transferred to your account within 3 working days.</p>
                                <div style={{ marginTop: "20px", display: "grid", gap: "16px" }}>
                                    <div>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Bank name</label>
                                        <input className="in" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. First Bank of Nigeria" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Account number</label>
                                        <input className="in" value={accountNo} onChange={e => setAccountNo(e.target.value)} placeholder="10-digit NUBAN number" />
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 5 && (
                            <>
                                <h2 style={{ font: "700 24px 'Figtree',sans-serif" }}>Submit for verification</h2>
                                <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>
                                    We{"'"}ll verify your licence with the relevant regulatory body. This usually takes 1–2 business days.
                                    You{"'"}ll receive an email when your profile goes live.
                                </p>
                                <div className="card" style={{ marginTop: "20px", background: "#f1f9f7", borderColor: "#b3d9d4" }}>
                                    <div style={{ font: "600 15px 'Figtree',sans-serif" }}>Review your details</div>
                                    <div style={{ display: "grid", gap: "6px", marginTop: "12px", font: "400 14px 'Figtree',sans-serif" }}>
                                        <div><span className="muted">Discipline: </span>{DISCIPLINE_LABELS[discipline] ?? discipline}</div>
                                        <div><span className="muted">Licence: </span>{licenceNo || "—"}</div>
                                        <div><span className="muted">Specialties: </span>{specialties || "—"}</div>
                                        <div><span className="muted">Service area: </span>{serviceArea || "—"}</div>
                                    </div>
                                </div>
                                {error && <div className="card" style={{ marginTop: "16px", background: "#fde8e8", borderColor: "#f3b4b4", color: "#8f1d1d", font: "400 14px 'Figtree',sans-serif" }}>{error}</div>}
                            </>
                        )}

                        {/* Navigation */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "24px", justifyContent: "space-between" }}>
                            {step > 0 ? (
                                <button type="button" className="btn btn2" onClick={() => { setError(null); setStep(s => s - 1); }}>Back</button>
                            ) : <span />}
                            {step < STEPS.length - 1 ? (
                                <button type="button" className="btn" onClick={() => { setError(null); setStep(s => s + 1); }}>Save and continue</button>
                            ) : (
                                <button type="button" className="btn" disabled={loading} onClick={submit}>
                                    {loading ? "Submitting…" : "Submit for verification"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
