"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { physioApplySchema, DISCIPLINE_LABELS } from "@physio/shared";
import { FileUpload } from "@/components/file-upload";

type Discipline = keyof typeof DISCIPLINE_LABELS;
const DISCIPLINES = Object.entries(DISCIPLINE_LABELS) as [Discipline, string][];
const VALID_DISCIPLINES = DISCIPLINES.map(([k]) => k);

const STEPS = [
    "Discipline",
    "Credentials & identity",
    "Profile & photo",
    "Availability",
    "Payout details",
    "Review & submit",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ProfessionalApplyPage() {
    const router = useRouter();
    const params = useSearchParams();
    const urlDiscipline = params.get("discipline") as Discipline | null;
    const [checking, setChecking] = useState(true);
    const [step, setStep] = useState(0);

    // Step 0
    const [discipline, setDiscipline] = useState<Discipline>(
        urlDiscipline && VALID_DISCIPLINES.includes(urlDiscipline) ? urlDiscipline : "PHYSIOTHERAPY"
    );

    // Step 1 — credentials & identity
    const [licenceNo, setLicenceNo] = useState("");
    const [licenceDocUrl, setLicenceDocUrl] = useState("");
    const [certificateUrl, setCertificateUrl] = useState("");
    const [ninNumber, setNinNumber] = useState("");
    const [ninDocUrl, setNinDocUrl] = useState("");

    // Step 2 — profile & photo
    const [photoUrl, setPhotoUrl] = useState("");
    const [specialties, setSpecialties] = useState("");
    const [bio, setBio] = useState("");
    const [serviceArea, setServiceArea] = useState("");

    // Step 3 — availability
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

    // Step 4 — payout
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

    // Per-step validation — returns error message or null
    function validateStep(): string | null {
        if (step === 1) {
            if (!licenceNo.trim()) return "Enter your licence / registration number.";
            if (!licenceDocUrl) return "Upload your licence document.";
            if (!certificateUrl) return "Upload your university / training certificate.";
            if (!ninNumber.trim()) return "Enter your 11-digit NIN.";
            if (!ninDocUrl) return "Upload your NIN document.";
        }
        if (step === 2) {
            if (!photoUrl) return "Upload a profile photo.";
            if (!specialties.trim()) return "List at least one specialty.";
            if (!bio.trim()) return "Write a short professional bio.";
            if (!serviceArea.trim()) return "Enter your service area.";
        }
        if (step === 3) {
            if (!sessionLen.trim()) return "Enter your session length.";
            if (!breakLen.trim()) return "Enter the break time between sessions.";
            if (!sessionTypes.trim()) return "Enter the session types you offer.";
            const hasDay = Object.values(avail).some(s => s.enabled);
            if (!hasDay) return "Enable at least one working day.";
        }
        if (step === 4) {
            if (!bankName.trim()) return "Enter your bank name.";
            if (!accountNo.trim()) return "Enter your account number.";
        }
        return null;
    }

    async function submit() {
        setError(null);
        const parsed = physioApplySchema.safeParse({
            discipline,
            licenceNo,
            licenceDocUrl,
            certificateUrl,
            ninNumber,
            ninDocUrl,
            photoUrl,
            specialties: specialties.split(",").map(s => s.trim()).filter(Boolean),
            bio,
            serviceArea,
        });
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Please check your inputs");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/proxy/physios/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed.data),
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error(b.message ?? "Application failed");
            }
            router.push("/pro/onboarding/pending");
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    const progress = Math.round((step / STEPS.length) * 100);

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
                <p className="muted" style={{ font: "400 16px 'Figtree',sans-serif", marginTop: "6px" }}>Complete all steps and submit for verification. This takes about 15 minutes.</p>
                <div style={{ height: "8px", borderRadius: "99px", background: "#dbe5e2", marginTop: "18px", maxWidth: "520px" }}>
                    <div style={{ width: `${progress}%`, height: "8px", borderRadius: "99px", background: "#1b766e", transition: "width .3s" }} />
                </div>
                <div className="muted" style={{ font: "600 13px 'Figtree',sans-serif", marginTop: "6px" }}>{step} of {STEPS.length} steps done</div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginTop: "24px", alignItems: "flex-start" }}>
                    {/* Sidebar checklist */}
                    <div style={{ flex: "0 1 280px", display: "grid", gap: "6px" }}>
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

                        {/* ── Step 0: Discipline ── */}
                        {step === 0 && (
                            <>
                                <h2 style={{ font: "700 24px 'Figtree',sans-serif" }}>Select your discipline</h2>
                                <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>Choose your primary rehabilitation field.</p>
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

                        {/* ── Step 1: Credentials & identity ── */}
                        {step === 1 && (
                            <>
                                <h2 style={{ font: "700 24px 'Figtree',sans-serif" }}>Credentials & identity</h2>
                                <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>We verify every licence and identity document before approving your profile.</p>
                                <div style={{ marginTop: "20px", display: "grid", gap: "20px" }}>
                                    <div>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Licence / registration number</label>
                                        <input className="in" value={licenceNo} onChange={e => setLicenceNo(e.target.value)} placeholder="As it appears on your regulatory board certificate" />
                                    </div>
                                    <FileUpload
                                        label="Licence document"
                                        hint="PDF, JPG or PNG · max 8 MB"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        value={licenceDocUrl}
                                        onChange={setLicenceDocUrl}
                                    />
                                    <FileUpload
                                        label="University / training certificate"
                                        hint="PDF, JPG or PNG · max 8 MB"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        value={certificateUrl}
                                        onChange={setCertificateUrl}
                                    />
                                    <div>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>NIN (National Identification Number)</label>
                                        <input className="in" value={ninNumber} onChange={e => setNinNumber(e.target.value)} placeholder="11-digit NIN" maxLength={11} />
                                    </div>
                                    <FileUpload
                                        label="NIN document / slip"
                                        hint="PDF, JPG or PNG · max 8 MB"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        value={ninDocUrl}
                                        onChange={setNinDocUrl}
                                    />
                                </div>
                            </>
                        )}

                        {/* ── Step 2: Profile & photo ── */}
                        {step === 2 && (
                            <>
                                <h2 style={{ font: "700 24px 'Figtree',sans-serif" }}>Profile & photo</h2>
                                <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>This is what patients see when they search for a specialist.</p>
                                <div style={{ marginTop: "20px", display: "grid", gap: "20px" }}>
                                    <FileUpload
                                        label="Profile photo"
                                        hint="JPG or PNG · shows as a circle · max 8 MB"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        value={photoUrl}
                                        onChange={setPhotoUrl}
                                        preview
                                    />
                                    <div>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Specialties</label>
                                        <input className="in" value={specialties} onChange={e => setSpecialties(e.target.value)} placeholder="Comma-separated, e.g. Paediatrics, Neuro, Post-op" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Bio / professional summary</label>
                                        <textarea className="in" value={bio} onChange={e => setBio(e.target.value)} placeholder="Your experience and approach to care" style={{ minHeight: "100px", padding: "10px 12px", resize: "vertical" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Service area</label>
                                        <input className="in" value={serviceArea} onChange={e => setServiceArea(e.target.value)} placeholder="City or region, e.g. Lagos Island" />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── Step 3: Availability ── */}
                        {step === 3 && (
                            <>
                                <h2 style={{ font: "700 24px 'Figtree',sans-serif" }}>Your weekly availability</h2>
                                <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>Patients can only book inside these hours. You can change them any time.</p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "20px" }}>
                                    <div style={{ flex: "1 1 180px" }}>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Session length (mins)</label>
                                        <input className="in" value={sessionLen} onChange={e => setSessionLen(e.target.value)} placeholder="45" />
                                    </div>
                                    <div style={{ flex: "1 1 180px" }}>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Break between sessions (mins)</label>
                                        <input className="in" value={breakLen} onChange={e => setBreakLen(e.target.value)} placeholder="15" />
                                    </div>
                                    <div style={{ flex: "1 1 180px" }}>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Session types offered</label>
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
                                                    {!slot.enabled && <span className="muted" style={{ font: "400 14px 'Figtree',sans-serif" }}>Not available</span>}
                                                    <button type="button" onClick={() => toggleDay(day)}
                                                        style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", font: "600 14px 'Figtree',sans-serif", color: slot.enabled ? "#8f1d1d" : "#1b766e", padding: 0 }}>
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

                        {/* ── Step 4: Payout ── */}
                        {step === 4 && (
                            <>
                                <h2 style={{ font: "700 24px 'Figtree',sans-serif" }}>Payout details</h2>
                                <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>Session fees are transferred to your account within 3 working days after each session.</p>
                                <div style={{ marginTop: "20px", display: "grid", gap: "16px" }}>
                                    <div>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Bank name</label>
                                        <input className="in" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. First Bank of Nigeria" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>Account number</label>
                                        <input className="in" value={accountNo} onChange={e => setAccountNo(e.target.value)} placeholder="10-digit NUBAN" maxLength={10} />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── Step 5: Review & submit ── */}
                        {step === 5 && (
                            <>
                                <h2 style={{ font: "700 24px 'Figtree',sans-serif" }}>Review your application</h2>
                                <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>Check everything below before submitting. Verification usually takes 1–2 business days.</p>

                                {/* Discipline */}
                                <ReviewSection title="Discipline">
                                    <ReviewRow label="Field" value={DISCIPLINE_LABELS[discipline] ?? discipline} />
                                </ReviewSection>

                                {/* Credentials */}
                                <ReviewSection title="Credentials & identity">
                                    <ReviewRow label="Licence number" value={licenceNo} />
                                    <ReviewRow label="Licence document" value={licenceDocUrl} isUrl />
                                    <ReviewRow label="University certificate" value={certificateUrl} isUrl />
                                    <ReviewRow label="NIN" value={ninNumber} />
                                    <ReviewRow label="NIN document" value={ninDocUrl} isUrl />
                                </ReviewSection>

                                {/* Profile */}
                                <ReviewSection title="Profile">
                                    {photoUrl && (
                                        <div style={{ marginBottom: "8px" }}>
                                            <img src={photoUrl} alt="Profile" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "2px solid #dbe5e2" }} />
                                        </div>
                                    )}
                                    <ReviewRow label="Specialties" value={specialties} />
                                    <ReviewRow label="Bio" value={bio} />
                                    <ReviewRow label="Service area" value={serviceArea} />
                                </ReviewSection>

                                {/* Availability */}
                                <ReviewSection title="Availability">
                                    <ReviewRow label="Session length" value={`${sessionLen} mins`} />
                                    <ReviewRow label="Break between sessions" value={`${breakLen} mins`} />
                                    <ReviewRow label="Session types" value={sessionTypes} />
                                    <div style={{ marginTop: "8px", display: "grid", gap: "4px" }}>
                                        {DAYS.filter(d => avail[d]?.enabled).map(d => (
                                            <div key={d} style={{ font: "400 14px 'Figtree',sans-serif", display: "flex", gap: "8px" }}>
                                                <span style={{ width: "100px", font: "600 14px 'Figtree',sans-serif" }}>{d}</span>
                                                <span className="muted">{avail[d]!.start} – {avail[d]!.end}</span>
                                            </div>
                                        ))}
                                        {!DAYS.some(d => avail[d]?.enabled) && <span className="muted" style={{ font: "400 14px 'Figtree',sans-serif" }}>No days selected</span>}
                                    </div>
                                </ReviewSection>

                                {/* Payout */}
                                <ReviewSection title="Payout details">
                                    <ReviewRow label="Bank" value={bankName} />
                                    <ReviewRow label="Account number" value={accountNo} />
                                </ReviewSection>

                                <div style={{ marginTop: "16px", padding: "12px 14px", borderRadius: "12px", background: "#e3f1ef", border: "1px solid #b3d9d4", font: "400 14px/1.5 'Figtree',sans-serif", color: "#14544e" }}>
                                    By submitting, you confirm all documents are authentic and the details above are accurate.
                                </div>
                            </>
                        )}

                        {/* Error banner */}
                        {error && (
                            <div style={{ marginTop: "16px", padding: "12px 14px", borderRadius: "12px", background: "#fde8e8", border: "1px solid #f3b4b4", color: "#8f1d1d", font: "400 14px 'Figtree',sans-serif" }}>
                                {error}
                            </div>
                        )}

                        {/* Navigation */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "24px", justifyContent: "space-between" }}>
                            {step > 0 ? (
                                <button type="button" className="btn btn2" onClick={() => { setError(null); setStep(s => s - 1); }}>Back</button>
                            ) : <span />}
                            {step < STEPS.length - 1 ? (
                                <button type="button" className="btn" onClick={() => {
                                    const err = validateStep();
                                    if (err) { setError(err); return; }
                                    setError(null);
                                    setStep(s => s + 1);
                                }}>Save and continue</button>
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

// ── Small helper components for the review step ──────────────────────────────

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginTop: "20px" }}>
            <div style={{ font: "700 15px 'Figtree',sans-serif", color: "#1b766e", borderBottom: "1px solid #dbe5e2", paddingBottom: "6px", marginBottom: "10px" }}>{title}</div>
            {children}
        </div>
    );
}

function ReviewRow({ label, value, isUrl }: { label: string; value: string; isUrl?: boolean }) {
    return (
        <div style={{ display: "flex", gap: "8px", font: "400 14px 'Figtree',sans-serif", marginBottom: "6px", flexWrap: "wrap" as const }}>
            <span className="muted" style={{ minWidth: "160px", flexShrink: 0 }}>{label}:</span>
            {isUrl && value ? (
                <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: "#1b766e", wordBreak: "break-all" }}>View document</a>
            ) : (
                <span style={{ wordBreak: "break-word" }}>{value || <span className="muted">—</span>}</span>
            )}
        </div>
    );
}
