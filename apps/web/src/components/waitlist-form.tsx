"use client";

import { useState } from "react";

const DISCIPLINES = [
    { key: "PHYSIO",      label: "Physiotherapy",        env: process.env.NEXT_PUBLIC_WHATSAPP_PHYSIO },
    { key: "OT",          label: "Occupational therapy", env: process.env.NEXT_PUBLIC_WHATSAPP_OT },
    { key: "SPEECH",      label: "Speech therapy",       env: process.env.NEXT_PUBLIC_WHATSAPP_SPEECH },
    { key: "PROSTHETIST", label: "Prosthetics",          env: process.env.NEXT_PUBLIC_WHATSAPP_PROSTHETIST },
    { key: "ORTHOTIST",   label: "Orthotics",            env: process.env.NEXT_PUBLIC_WHATSAPP_ORTHOTIST },
] as const;

export default function WaitlistForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [city, setCity] = useState("");
    const [discipline, setDiscipline] = useState<string>("PHYSIO");
    const [submitted, setSubmitted] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const link = DISCIPLINES.find(d => d.key === discipline)?.env;
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
                    Welcome to the Rehab360 specialist community. Check your WhatsApp group for next steps.
                </p>
                <button type="button" className="btn btn2" style={{ marginTop: "20px" }} onClick={() => setSubmitted(false)}>
                    Add another specialist
                </button>
            </div>
        );
    }

    return (
        <div className="card" style={{ flex: "1 1 420px", color: "#022449" }}>
            <p style={{ font: "600 15px 'Figtree',sans-serif", margin: "0 0 16px" }}>Apply as a Founding Specialist</p>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
                <div>
                    <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }} htmlFor="w-name">Full name</label>
                    <input className="in" id="w-name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                    <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }} htmlFor="w-email">Work email</label>
                    <input className="in" id="w-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
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
                    <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }} htmlFor="w-city">City</label>
                    <input className="in" id="w-city" placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <button type="submit" className="btn" style={{ width: "100%" }}>
                    Join as a Founding Specialist →
                </button>
            </form>
        </div>
    );
}
