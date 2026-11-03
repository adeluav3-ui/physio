"use client";

import { useState } from "react";

const DISCIPLINES = [
    { key: "PHYSIO",      label: "Physiotherapy",        env: process.env.NEXT_PUBLIC_WHATSAPP_PHYSIO },
    { key: "OT",          label: "Occupational therapy", env: process.env.NEXT_PUBLIC_WHATSAPP_OT },
    { key: "SPEECH",      label: "Speech therapy",       env: process.env.NEXT_PUBLIC_WHATSAPP_SPEECH },
    { key: "PROSTHETIST", label: "Prosthetics",          env: process.env.NEXT_PUBLIC_WHATSAPP_PROSTHETIST },
    { key: "ORTHOTIST",   label: "Orthotics",            env: process.env.NEXT_PUBLIC_WHATSAPP_ORTHOTIST },
] as const;

const PATIENT_LINK = process.env.NEXT_PUBLIC_WHATSAPP_PATIENTS;

export default function WaitlistForm() {
    const [mode, setMode] = useState<"patient" | "pro">("patient");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [need, setNeed] = useState("");
    const [city, setCity] = useState("");
    const [discipline, setDiscipline] = useState<string>("PHYSIO");
    const [submitted, setSubmitted] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        let link: string | undefined;
        if (mode === "patient") {
            link = PATIENT_LINK;
        } else {
            link = DISCIPLINES.find(d => d.key === discipline)?.env;
        }

        setSubmitted(true);

        if (link) {
            window.open(link, "_blank", "noopener,noreferrer");
        }
    }

    if (submitted) {
        return (
            <div className="card" style={{ flex: "1 1 420px", color: "#022449", textAlign: "center", padding: "40px 32px" }}>
                <div style={{ font: "700 22px 'Figtree',sans-serif", color: "#1b7d0e" }}>You're on the list!</div>
                <p className="muted" style={{ font: "400 15px/1.55 'Figtree',sans-serif", marginTop: "10px" }}>
                    {mode === "patient"
                        ? "We'll invite you when your city opens. Check your WhatsApp group for updates."
                        : "Welcome to the Rehab360 professional community. Check your WhatsApp group for next steps."}
                </p>
                <button type="button" className="btn btn2" style={{ marginTop: "20px" }} onClick={() => setSubmitted(false)}>
                    Add another person
                </button>
            </div>
        );
    }

    return (
        <div className="card" style={{ flex: "1 1 420px", color: "#022449" }}>
            {/* Toggle */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                <button
                    type="button"
                    onClick={() => setMode("patient")}
                    style={{ flex: 1, padding: "12px", textAlign: "center", borderRadius: "10px", border: "none", cursor: "pointer", background: mode === "patient" ? "#1b7d0e" : "#eef3f8", color: mode === "patient" ? "#fff" : "#022449", font: "600 15px 'Figtree',sans-serif", transition: "background .15s" }}
                >
                    I need care
                </button>
                <button
                    type="button"
                    onClick={() => setMode("pro")}
                    style={{ flex: 1, padding: "12px", textAlign: "center", borderRadius: "10px", border: "none", cursor: "pointer", background: mode === "pro" ? "#1b7d0e" : "#eef3f8", color: mode === "pro" ? "#fff" : "#022449", font: "600 15px 'Figtree',sans-serif", transition: "background .15s" }}
                >
                    I provide care
                </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
                <div>
                    <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }} htmlFor="w-name">Full name</label>
                    <input className="in" id="w-name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                    <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }} htmlFor="w-email">Email</label>
                    <input className="in" id="w-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                {mode === "patient" && (
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "12px" }}>
                        <div style={{ flex: "1 1 180px" }}>
                            <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }} htmlFor="w-need">What do you need help with?</label>
                            <input className="in" id="w-need" placeholder="Pick one, or not sure" value={need} onChange={e => setNeed(e.target.value)} />
                        </div>
                        <div style={{ flex: "1 1 140px" }}>
                            <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }} htmlFor="w-city">City</label>
                            <input className="in" id="w-city" placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
                        </div>
                    </div>
                )}

                {mode === "pro" && (
                    <>
                        <div>
                            <div style={{ font: "600 13px 'Figtree',sans-serif", marginBottom: "8px" }}>Your discipline</div>
                            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px" }}>
                                {DISCIPLINES.map(d => (
                                    <button
                                        key={d.key}
                                        type="button"
                                        className={`slot${discipline === d.key ? " on" : ""}`}
                                        onClick={() => setDiscipline(d.key)}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }} htmlFor="w-city-pro">City</label>
                            <input className="in" id="w-city-pro" placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
                        </div>
                    </>
                )}

                <button type="submit" className="btn" style={{ width: "100%" }}>
                    Join the waitlist →
                </button>
            </form>
        </div>
    );
}
