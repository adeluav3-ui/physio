"use client";

import { useEffect, useState } from "react";

type Profile = {
    userId: string;
    discipline: string;
    licenceStatus: string;
    bio: string;
    specialties: string[];
    languages: string[];
    serviceArea: string;
    photoUrl: string | null;
    sessionTypes: string[];
    sessionMinutes: number;
    bufferMinutes: number;
    acceptingPatients: boolean;
    user: { name: string };
};

const SESSION_TYPES = ["VIDEO", "CHAT", "HOME"];
const SESSION_TYPE_LABELS: Record<string, string> = { VIDEO: "Video call", CHAT: "Chat only", HOME: "Home visit" };
const LANGUAGES = ["English", "Yoruba", "Igbo", "Hausa", "French", "Pidgin"];

export default function ProProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Editable fields
    const [bio, setBio] = useState("");
    const [specialties, setSpecialties] = useState("");
    const [languages, setLanguages] = useState<string[]>([]);
    const [serviceArea, setServiceArea] = useState("");
    const [sessionTypes, setSessionTypes] = useState<string[]>([]);
    const [sessionMinutes, setSessionMinutes] = useState("45");
    const [bufferMinutes, setBufferMinutes] = useState("15");
    const [accepting, setAccepting] = useState(true);

    useEffect(() => {
        fetch("/api/proxy/physios/me")
            .then((r) => (r.ok ? r.json() : null))
            .then((p: Profile | null) => {
                if (!p) return;
                setProfile(p);
                setBio(p.bio ?? "");
                setSpecialties((p.specialties ?? []).join(", "));
                setLanguages(p.languages ?? []);
                setServiceArea(p.serviceArea ?? "");
                setSessionTypes(p.sessionTypes ?? []);
                setSessionMinutes(String(p.sessionMinutes ?? 45));
                setBufferMinutes(String(p.bufferMinutes ?? 15));
                setAccepting(p.acceptingPatients ?? true);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    function toggleLanguage(lang: string) {
        setLanguages((prev) => prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]);
    }

    function toggleSessionType(t: string) {
        setSessionTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
    }

    async function save() {
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            if (sessionTypes.length === 0) throw new Error("Select at least one session type.");

            // Update profile fields
            const r1 = await fetch("/api/proxy/physios/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bio: bio.trim(),
                    specialties: specialties.split(",").map((s) => s.trim()).filter(Boolean),
                    languages,
                    serviceArea: serviceArea.trim(),
                    sessionTypes,
                }),
            });
            if (!r1.ok) {
                const b = await r1.json().catch(() => ({}));
                throw new Error((b as { message?: string }).message ?? "Failed to save profile.");
            }

            // Update settings
            const r2 = await fetch("/api/proxy/physios/me/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionMinutes: Number(sessionMinutes),
                    bufferMinutes: Number(bufferMinutes),
                    acceptingPatients: accepting,
                }),
            });
            if (!r2.ok) {
                const b = await r2.json().catch(() => ({}));
                throw new Error((b as { message?: string }).message ?? "Failed to save settings.");
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <div className="muted" style={{ font: "400 15px 'Figtree',sans-serif", padding: "20px 0" }}>Loading…</div>;
    }

    if (!profile) {
        return <div className="muted" style={{ font: "400 15px 'Figtree',sans-serif", padding: "20px 0" }}>Could not load profile.</div>;
    }

    return (
        <div style={{ maxWidth: "680px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "24px" }}>
                <div>
                    <h1 style={{ font: "700 24px 'Figtree',sans-serif", margin: 0 }}>My profile</h1>
                    <p className="muted" style={{ font: "400 14px 'Figtree',sans-serif", marginTop: "4px" }}>
                        {profile.user.name} · {profile.discipline.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                </div>
                <span className={`chip ${profile.licenceStatus === "VERIFIED" ? "ok" : "warn"}`}>
                    {profile.licenceStatus === "VERIFIED" ? "Verified" : profile.licenceStatus.toLowerCase()}
                </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Accepting toggle */}
                <div className="card" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px" }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ font: "600 15px 'Figtree',sans-serif" }}>Accepting new patients</div>
                        <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif", marginTop: "2px" }}>
                            When off, you won't appear in search results.
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAccepting((v) => !v)}
                        style={{
                            width: "52px", height: "30px", borderRadius: "15px", border: "none", cursor: "pointer",
                            background: accepting ? "#1b7d0e" : "#c3d1de", transition: "background .2s", position: "relative",
                        }}
                    >
                        <span style={{
                            position: "absolute", top: "3px",
                            left: accepting ? "26px" : "4px",
                            width: "24px", height: "24px", borderRadius: "50%", background: "#fff",
                            transition: "left .2s", display: "block",
                        }} />
                    </button>
                </div>

                {/* Bio */}
                <div className="card">
                    <label className="flabel" htmlFor="bio">Professional bio</label>
                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="in"
                        style={{ minHeight: "96px", padding: "10px 12px", resize: "vertical" }}
                        placeholder="Describe your experience, qualifications, and approach to care…"
                    />
                </div>

                {/* Specialties */}
                <div className="card">
                    <label className="flabel" htmlFor="spec">Areas of practice</label>
                    <input
                        id="spec"
                        type="text"
                        value={specialties}
                        onChange={(e) => setSpecialties(e.target.value)}
                        className="in"
                        placeholder="e.g. Shoulder, Back and neck, Post-op, Sports"
                    />
                    <p className="muted" style={{ font: "400 12px 'Figtree',sans-serif", marginTop: "6px" }}>Separate with commas. Patients search by these terms.</p>
                </div>

                {/* Languages */}
                <div className="card">
                    <div className="flabel">Languages spoken</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => toggleLanguage(lang)}
                                style={{
                                    padding: "8px 14px", borderRadius: "99px", cursor: "pointer",
                                    font: "600 13px 'Figtree',sans-serif", border: "1.5px solid",
                                    borderColor: languages.includes(lang) ? "#1b7d0e" : "#c3d1de",
                                    background: languages.includes(lang) ? "#e6f4e1" : "#fff",
                                    color: languages.includes(lang) ? "#0f5a08" : "#022449",
                                }}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Session types */}
                <div className="card">
                    <div className="flabel">Session types offered</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                        {SESSION_TYPES.map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => toggleSessionType(t)}
                                style={{
                                    padding: "8px 14px", borderRadius: "99px", cursor: "pointer",
                                    font: "600 13px 'Figtree',sans-serif", border: "1.5px solid",
                                    borderColor: sessionTypes.includes(t) ? "#1b7d0e" : "#c3d1de",
                                    background: sessionTypes.includes(t) ? "#e6f4e1" : "#fff",
                                    color: sessionTypes.includes(t) ? "#0f5a08" : "#022449",
                                }}
                            >
                                {SESSION_TYPE_LABELS[t]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Platform pricing notice */}
                <div className="card" style={{ background: "#f0f7fe", borderColor: "#b6d4f0" }}>
                    <div style={{ font: "600 14px 'Figtree',sans-serif", color: "#07506b" }}>Platform pricing</div>
                    <p className="muted" style={{ font: "400 13px 'Figtree',sans-serif", marginTop: "4px", color: "#07506b" }}>
                        Session fees are set by Rehab360: <strong>₦10,000</strong> for a first consultation and <strong>₦5,000</strong> for follow-up sessions. You receive 90% of the session fee after a 24-hour release window.
                    </p>
                </div>

                {/* Session length & buffer */}
                <div className="card">
                    <div className="flabel">Session settings</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "4px" }}>
                        <div style={{ flex: "1 1 140px" }}>
                            <label className="flabel" htmlFor="slen" style={{ fontWeight: 500 }}>Session length (min)</label>
                            <input id="slen" type="number" min="15" max="120" step="5" value={sessionMinutes} onChange={(e) => setSessionMinutes(e.target.value)} className="in" />
                        </div>
                        <div style={{ flex: "1 1 140px" }}>
                            <label className="flabel" htmlFor="buf" style={{ fontWeight: 500 }}>Break between sessions (min)</label>
                            <input id="buf" type="number" min="0" max="60" step="5" value={bufferMinutes} onChange={(e) => setBufferMinutes(e.target.value)} className="in" />
                        </div>
                    </div>
                </div>

                {/* Service area */}
                <div className="card">
                    <label className="flabel" htmlFor="area">Service area</label>
                    <input
                        id="area"
                        type="text"
                        value={serviceArea}
                        onChange={(e) => setServiceArea(e.target.value)}
                        className="in"
                        placeholder="e.g. Lagos Island, Victoria Island, Lekki"
                    />
                </div>

                {error && (
                    <div style={{ background: "#fff0ef", border: "1px solid #f9b8b8", borderRadius: "12px", padding: "12px 16px", font: "400 14px 'Figtree',sans-serif", color: "#c90000" }}>
                        {error}
                    </div>
                )}

                {saved && (
                    <div style={{ background: "#e8f7e5", border: "1px solid #b6dcc2", borderRadius: "12px", padding: "12px 16px", font: "400 14px 'Figtree',sans-serif", color: "#1d5c34" }}>
                        Profile saved successfully.
                    </div>
                )}

                <button
                    type="button"
                    disabled={saving}
                    onClick={save}
                    className="btn"
                    style={{ alignSelf: "flex-start", minWidth: "140px" }}
                >
                    {saving ? "Saving…" : "Save changes"}
                </button>
            </div>
        </div>
    );
}
