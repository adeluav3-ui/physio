"use client";

import { useState } from "react";

type PilotSettings = {
    pilotModeEnabled: boolean;
    pilotStartDate: string;
    pilotEndDate: string;
    commissionBps: number;
    serviceFeeBps: number;
    serviceFeeCapKobo: number;
    freeIntroVideoSessions: number;
    videoAddonKobo: number;
    sessionTarget: number;
};

export default function PilotSettingsForm({ settings }: { settings: PilotSettings }) {
    const [form, setForm] = useState({
        pilotModeEnabled: settings.pilotModeEnabled,
        pilotStartDate: settings.pilotStartDate.slice(0, 10),
        pilotEndDate: settings.pilotEndDate.slice(0, 10),
        commissionBps: settings.commissionBps,
        serviceFeeBps: settings.serviceFeeBps,
        serviceFeeCapKobo: settings.serviceFeeCapKobo,
        freeIntroVideoSessions: settings.freeIntroVideoSessions,
        videoAddonKobo: settings.videoAddonKobo,
        sessionTarget: settings.sessionTarget,
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function save() {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/proxy/admin/pilot-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.message ?? `HTTP ${res.status}`);
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setSaving(false);
        }
    }

    const field = (label: string, key: keyof typeof form, type: "number" | "date" | "checkbox" = "number") => (
        <div key={key}>
            <label style={{ display: "block", font: "500 13px 'Figtree',sans-serif", marginBottom: "4px" }}>{label}</label>
            {type === "checkbox" ? (
                <input
                    type="checkbox"
                    checked={form[key] as boolean}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
            ) : (
                <input
                    type={type}
                    value={form[key] as string | number}
                    onChange={e => setForm(f => ({
                        ...f,
                        [key]: type === "number" ? Number(e.target.value) : e.target.value,
                    }))}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #c8d8e6", borderRadius: "8px", font: "500 15px 'Figtree',sans-serif" }}
                />
            )}
        </div>
    );

    return (
        <form onSubmit={e => { e.preventDefault(); void save(); }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "14px" }}>
                {field("Pilot mode enabled", "pilotModeEnabled", "checkbox")}
                {field("Pilot start date", "pilotStartDate", "date")}
                {field("Pilot end date", "pilotEndDate", "date")}
                {field("Commission (bps)", "commissionBps")}
                {field("Service fee (bps)", "serviceFeeBps")}
                {field("Service fee cap (kobo)", "serviceFeeCapKobo")}
                {field("Free video sessions", "freeIntroVideoSessions")}
                {field("Video add-on (kobo)", "videoAddonKobo")}
                {field("Session target", "sessionTarget")}
            </div>

            {error && (
                <div style={{ marginTop: "12px", padding: "10px 14px", background: "#fef2f2", borderRadius: "8px", color: "#b91c1c", font: "500 14px 'Figtree',sans-serif" }}>
                    {error}
                </div>
            )}

            <div style={{ marginTop: "16px", display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                    type="submit"
                    disabled={saving}
                    className="btn"
                    style={{ minWidth: "120px" }}
                >
                    {saving ? "Saving…" : "Save settings"}
                </button>
                {saved && <span style={{ color: "#1b7d0e", font: "500 14px 'Figtree',sans-serif" }}>✓ Saved</span>}
            </div>
        </form>
    );
}
