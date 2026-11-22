"use client";

import { useState } from "react";
import Link from "next/link";
import type { PublicProfessional } from "./page";

const DISCIPLINE_LABELS: Record<string, string> = {
    PHYSIOTHERAPY: "Physiotherapy",
    OCCUPATIONAL_THERAPY: "Occupational therapy",
    SPEECH_THERAPY: "Speech therapy",
    PROSTHETICS: "Prosthetics",
    ORTHOTICS: "Orthotics",
};

const PILLS = ["All", "Physiotherapy", "Occupational therapy", "Speech therapy", "Prosthetics", "Orthotics"] as const;
const SESSION_PILLS = ["Video", "Home visit", "Clinic"] as const;

const AVATAR_COLORS = ["#cfe3ee", "#d9e6f2", "#efe3d3", "#dde9d5", "#e8dced"];

export default function ProfessionalsClient({ professionals }: { professionals: PublicProfessional[] }) {
    const [query, setQuery] = useState("");
    const [city, setCity] = useState("");
    const [discipline, setDiscipline] = useState("All");
    const [sessionType, setSessionType] = useState("All");

    const filtered = professionals.filter(p => {
        const label = DISCIPLINE_LABELS[p.discipline] ?? p.discipline;
        if (discipline !== "All" && label !== discipline) return false;
        if (sessionType !== "All" && !p.sessionTypes?.some(s => s.toLowerCase().includes(sessionType.toLowerCase()))) return false;
        if (city && !p.serviceArea?.toLowerCase().includes(city.toLowerCase())) return false;
        const q = query.toLowerCase();
        if (q && !p.user.name.toLowerCase().includes(q) && !label.toLowerCase().includes(q) && !p.specialties?.join(" ").toLowerCase().includes(q)) return false;
        return true;
    });

    return (
        <>
            {/* Search card */}
            <div className="card" style={{ marginTop: "20px", display: "flex", flexWrap: "wrap" as const, gap: "12px", alignItems: "flex-end" }}>
                <div style={{ flex: "2 1 260px" }}>
                    <label htmlFor="f-q" style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>What do you need help with?</label>
                    <input className="in" id="f-q" value={query} onChange={e => setQuery(e.target.value)} placeholder="Back pain, speech delay, artificial leg" />
                </div>
                <div style={{ flex: "1 1 160px" }}>
                    <label htmlFor="f-c" style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>City</label>
                    <input className="in" id="f-c" value={city} onChange={e => setCity(e.target.value)} placeholder="Sagamu" />
                </div>
                <button type="button" className="btn" style={{ flex: "0 0 auto" }}>Search</button>
            </div>

            {/* Filter pills */}
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", marginTop: "16px" }}>
                {PILLS.map(p => (
                    <button key={p} type="button" className={`pill${discipline === p ? " pillon" : ""}`} onClick={() => setDiscipline(p)}>{p}</button>
                ))}
                <span style={{ marginLeft: "auto", display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
                    {SESSION_PILLS.map(p => (
                        <button key={p} type="button" className={`pill${sessionType === p ? " pillon" : ""}`} onClick={() => setSessionType(prev => prev === p ? "All" : p)}>{p}</button>
                    ))}
                </span>
            </div>

            <p className="muted" style={{ font: "400 14px 'Figtree',sans-serif", margin: "20px 0 12px" }}>
                {professionals.length === 0
                    ? "Showing sample results. Real professionals appear after verification."
                    : `${filtered.length} professional${filtered.length !== 1 ? "s" : ""} found.`}
            </p>

            <div style={{ display: "grid", gap: "14px", paddingBottom: "64px" }}>
                {filtered.length === 0 && professionals.length > 0 ? (
                    <div className="card" style={{ textAlign: "center", color: "#4f6478" }}>No professionals match your filters.</div>
                ) : filtered.length === 0 ? (
                    /* Sample cards when API has no data */
                    [
                        { name: "[Professional name]", disc: "Physiotherapist", spec: "Sports injuries, back pain · English, Yoruba", sessions: ["Video", "Home visit"], bg: AVATAR_COLORS[0], next: "Tomorrow, 10:00 am" },
                        { name: "[Professional name]", disc: "Speech and language therapist", spec: "Children, stroke recovery · English", sessions: ["Video"], bg: AVATAR_COLORS[1], next: "Mon, 2:00 pm" },
                        { name: "[Professional name]", disc: "Orthotist", spec: "Braces, footwear, spinal supports · English, Yoruba", sessions: ["Video consult", "Clinic fitting"], bg: AVATAR_COLORS[2], next: "Wed, 11:30 am" },
                    ].map((s, i) => (
                        <div key={i} className="card" style={{ display: "flex", flexWrap: "wrap" as const, gap: "20px", alignItems: "center" }}>
                            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: s.bg, flexShrink: 0 }}></div>
                            <div style={{ flex: "1 1 300px" }}>
                                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", alignItems: "center" }}>
                                    <h3 style={{ font: "700 19px 'Figtree',sans-serif", margin: 0 }}>{s.name}</h3>
                                    <span className="chip-sm ok">Licence verified</span>
                                </div>
                                <div className="muted" style={{ font: "500 15px 'Figtree',sans-serif", marginTop: "4px" }}>{s.disc} · {s.spec}</div>
                                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                                    {s.sessions.map(st => <span key={st} className="chip-sm">{st}</span>)}
                                </div>
                            </div>
                            <div style={{ textAlign: "right", flex: "0 0 190px" }}>
                                <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif" }}>Next open</div>
                                <div style={{ font: "600 16px 'Figtree',sans-serif" }}>{s.next}</div>
                                <div style={{ font: "700 18px 'Figtree',sans-serif", marginTop: "6px" }}>₦[price]</div>
                                <a className="btn" href="/auth/signup" style={{ marginTop: "10px", width: "100%" }}>Book</a>
                            </div>
                        </div>
                    ))
                ) : (
                    filtered.map((p, i) => (
                        <div key={p.userId} className="card" style={{ display: "flex", flexWrap: "wrap" as const, gap: "20px", alignItems: "center" }}>
                            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: AVATAR_COLORS[i % AVATAR_COLORS.length], flexShrink: 0 }}></div>
                            <div style={{ flex: "1 1 300px" }}>
                                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", alignItems: "center" }}>
                                    <h3 style={{ font: "700 19px 'Figtree',sans-serif", margin: 0 }}>{p.user.name}</h3>
                                    {p.verified && <span className="chip-sm ok">Licence verified</span>}
                                </div>
                                <div className="muted" style={{ font: "500 15px 'Figtree',sans-serif", marginTop: "4px" }}>
                                    {DISCIPLINE_LABELS[p.discipline] ?? p.discipline}
                                    {p.specialties?.length ? ` · ${p.specialties.join(", ")}` : ""}
                                    {p.languages?.length ? ` · ${p.languages.join(", ")}` : ""}
                                </div>
                                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                                    {(p.sessionTypes ?? []).map(s => <span key={s} className="chip-sm">{s}</span>)}
                                </div>
                            </div>
                            <div style={{ textAlign: "right", flex: "0 0 190px" }}>
                                <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif" }}>per session</div>
                                <div style={{ font: "700 18px 'Figtree',sans-serif", marginTop: "6px" }}>₦{(p.rateKobo / 100).toLocaleString()}</div>
                                <Link href={`/professionals/${p.userId}`} className="btn" style={{ marginTop: "10px", width: "100%", display: "inline-flex" }}>Book</Link>
                                <Link href={`/app/book/express/${p.userId}`} className="btn" style={{ marginTop: "8px", width: "100%", display: "inline-flex", background: "#0d6e8a" }}>Express meeting</Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}
