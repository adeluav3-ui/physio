"use client";

import { useEffect, useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type AvailBlock = { weekday: number; startMinute: number; endMinute: number; mode: Mode };
type Mode = "VIDEO" | "HOME" | "CHAT";
type DayOff = { id: string; date: string; reason: string | null };
type Settings = {
    sessionMinutes: number;
    bufferMinutes: number;
    acceptingPatients: boolean;
    sessionTypes: string[];
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SESSION_OPTS = [30, 45, 60];
const BUFFER_OPTS = [0, 5, 15];
const MODE_LABELS: Record<Mode, string> = { VIDEO: "Video", HOME: "In person", CHAT: "Chat" };

function minutesToTime(m: number) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const ampm = h < 12 ? "am" : "pm";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(min).padStart(2, "0")} ${ampm}`;
}

function timeToMinutes(t: string): number {
    const [time, ampm] = t.split(" ");
    const [hStr, mStr] = (time ?? "").split(":");
    let h = parseInt(hStr ?? "0", 10);
    const min = parseInt(mStr ?? "0", 10);
    if (ampm === "pm" && h !== 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    return h * 60 + min;
}

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
    for (const min of [0, 30]) {
        if (h === 22 && min === 30) continue;
        const ampm = h < 12 ? "am" : "pm";
        const h12 = h % 12 === 0 ? 12 : h % 12;
        TIME_OPTIONS.push(`${h12}:${String(min).padStart(2, "0")} ${ampm}`);
    }
}

// ── Styles (matching Availability.dc.html) ────────────────────────────────────

const S = {
    shell: { display: "flex", flexDirection: "column" as const, minHeight: "100dvh", background: "#f4f8fb", color: "#022449" },
    strip: { height: "5px", background: "linear-gradient(90deg,#4eb91e 0%,#0eaf90 50%,#076889 100%)", flexShrink: 0 },
    body: { display: "flex", flex: 1, minHeight: 0 },
    aside: { width: "240px", flexShrink: 0, background: "#fff", borderRight: "1px solid #d9e3ec", padding: "20px 16px", display: "flex", flexDirection: "column" as const },
    main: { flex: 1, minWidth: 0, padding: "28px", overflowY: "auto" as const },
    nav: (active: boolean): React.CSSProperties => ({
        display: "block", padding: "10px 12px", borderRadius: "10px",
        font: "500 15px 'Figtree',sans-serif", color: active ? "#0f5a08" : "#022449",
        background: active ? "#e6f4e1" : "transparent", fontWeight: active ? 600 : 500,
        textDecoration: "none", marginBottom: "2px",
    }),
    btn: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "42px", padding: "0 18px", borderRadius: "10px", background: "#1b7d0e", color: "#fff", font: "600 14px 'Figtree',sans-serif", border: "0", cursor: "pointer" } as React.CSSProperties,
    btn2: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "36px", padding: "0 12px", borderRadius: "10px", background: "#fff", color: "#022449", font: "600 13px 'Figtree',sans-serif", border: "1px solid #c3d1de", cursor: "pointer" } as React.CSSProperties,
    card: { background: "#fff", border: "1px solid #d9e3ec", borderRadius: "14px", padding: "20px" },
    chip: (colour?: "warn" | "ok"): React.CSSProperties => ({
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "4px 10px", borderRadius: "99px", font: "600 12px 'Figtree',sans-serif",
        background: colour === "warn" ? "#fdf1d8" : colour === "ok" ? "#e3f4e8" : "#e3f1f6",
        color: colour === "warn" ? "#7a4f00" : colour === "ok" ? "#1d5c34" : "#07506b",
    }),
    tog: (on: boolean): React.CSSProperties => ({
        width: "44px", height: "26px", borderRadius: "99px", flexShrink: 0,
        background: on ? "#1b7d0e" : "#b4c4d3", position: "relative", cursor: "pointer", border: 0,
        transition: "background .15s",
    }),
    togThumb: (on: boolean): React.CSSProperties => ({
        position: "absolute", left: on ? "21px" : "3px", top: "3px",
        width: "20px", height: "20px", borderRadius: "50%", background: "#fff",
        transition: "left .15s",
    }),
    timeSelect: { display: "inline-flex", alignItems: "center", minHeight: "40px", padding: "0 10px", border: "1px solid #b4c4d3", borderRadius: "10px", font: "600 14px 'Figtree',sans-serif", background: "#fff", cursor: "pointer" } as React.CSSProperties,
    seg: { display: "inline-flex", border: "1px solid #c3d1de", borderRadius: "10px", overflow: "hidden" },
    segItem: (on: boolean): React.CSSProperties => ({
        padding: "10px 16px", font: "600 14px 'Figtree',sans-serif", cursor: "pointer",
        background: on ? "#1b7d0e" : "#fff", color: on ? "#fff" : "#022449", border: 0,
    }),
    slot: (off: boolean): React.CSSProperties => ({
        padding: "8px 12px", borderRadius: "10px", border: `1px solid ${off ? "#d9e3ec" : "#1b7d0e"}`,
        color: off ? "#7d93a8" : "#0f5a08", font: "600 13px 'Figtree',sans-serif",
        background: off ? "#eef3f8" : "#fff", textDecoration: off ? "line-through" : "none",
    }),
};

// ── Component ────────────────────────────────────────────────────────────────

export default function ProAvailabilityPage() {
    const [blocks, setBlocks] = useState<AvailBlock[]>([]);
    const [daysOff, setDaysOff] = useState<DayOff[]>([]);
    const [settings, setSettings] = useState<Settings>({ sessionMinutes: 45, bufferMinutes: 15, acceptingPatients: true, sessionTypes: ["VIDEO"] });
    const [proName, setProName] = useState("Your name");
    const [discipline, setDiscipline] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [addDayOffDate, setAddDayOffDate] = useState("");
    const [previewDay, setPreviewDay] = useState(1); // Monday

    useEffect(() => {
        Promise.all([
            fetch("/api/proxy/physios/me").then((r) => r.ok ? r.json() : null),
            fetch("/api/proxy/booking/days-off").then((r) => r.ok ? r.json() : []),
        ]).then(([profile, dOff]) => {
            if (profile) {
                // Existing availability blocks come from /booking/availability/:physioId
                fetch(`/api/proxy/booking/availability/${profile.userId}`)
                    .then((r) => r.ok ? r.json() : [])
                    .then((av: AvailBlock[]) => setBlocks(av));

                setSettings({
                    sessionMinutes: profile.sessionMinutes ?? 45,
                    bufferMinutes: profile.bufferMinutes ?? 15,
                    acceptingPatients: profile.acceptingPatients ?? true,
                    sessionTypes: profile.sessionTypes?.length ? profile.sessionTypes : ["VIDEO"],
                });
                setProName(profile.user?.name ?? "Your name");
                setDiscipline(profile.discipline ?? "");
            }
            setDaysOff(dOff);
        }).catch(() => { });
    }, []);

    // ── Derived: slot preview ─────────────────────────────────────────────────

    function previewSlots() {
        const step = settings.sessionMinutes + settings.bufferMinutes;
        const dayBlocks = blocks.filter((b) => b.weekday === previewDay);
        const slots: { time: string; busy: boolean }[] = [];
        for (const b of dayBlocks) {
            for (let m = b.startMinute; m + settings.sessionMinutes <= b.endMinute; m += step) {
                slots.push({ time: minutesToTime(m), busy: false });
            }
        }
        // mark first slot as "busy" for illustration if more than 1 slot
        if (slots.length > 1) slots[0]!.busy = true;
        return slots;
    }

    // ── Day block helpers ─────────────────────────────────────────────────────

    function dayBlocks(weekday: number) {
        return blocks.filter((b) => b.weekday === weekday);
    }

    function toggleDay(weekday: number) {
        const has = dayBlocks(weekday).length > 0;
        if (has) {
            setBlocks((prev) => prev.filter((b) => b.weekday !== weekday));
        } else {
            setBlocks((prev) => [
                ...prev,
                { weekday, startMinute: 9 * 60, endMinute: 17 * 60, mode: "VIDEO" },
            ]);
        }
    }

    function updateBlock(weekday: number, idx: number, patch: Partial<AvailBlock>) {
        setBlocks((prev) => {
            const all = prev.filter((b) => b.weekday === weekday);
            const updated = { ...all[idx]!, ...patch };
            return prev.map((b) => {
                if (b.weekday !== weekday) return b;
                const i = prev.filter((x) => x.weekday === weekday).indexOf(b);
                return i === idx ? updated : b;
            });
        });
    }

    function addBlock(weekday: number) {
        setBlocks((prev) => [
            ...prev,
            { weekday, startMinute: 18 * 60, endMinute: 21 * 60, mode: "VIDEO" },
        ]);
    }

    function removeBlock(weekday: number, idx: number) {
        setBlocks((prev) => {
            const all = prev.filter((b) => b.weekday === weekday);
            const toRemove = all[idx];
            return prev.filter((b) => b !== toRemove);
        });
    }

    // ── Days off ──────────────────────────────────────────────────────────────

    async function handleAddDayOff() {
        if (!addDayOffDate) return;
        const res = await fetch("/api/proxy/booking/days-off", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: addDayOffDate }),
        });
        if (res.ok) {
            const d: DayOff = await res.json();
            setDaysOff((prev) => [...prev, d]);
            setAddDayOffDate("");
        }
    }

    async function handleRemoveDayOff(id: string) {
        await fetch(`/api/proxy/booking/days-off/${id}`, { method: "DELETE" });
        setDaysOff((prev) => prev.filter((d) => d.id !== id));
    }

    // ── Save ──────────────────────────────────────────────────────────────────

    async function handleSave() {
        setSaving(true);
        setError(null);
        try {
            const [r1, r2] = await Promise.all([
                fetch("/api/proxy/booking/availability", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ slots: blocks }),
                }),
                fetch("/api/proxy/physios/me/settings", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(settings),
                }),
            ]);
            if (!r1.ok || !r2.ok) {
                const b = await (r1.ok ? r2 : r1).json().catch(() => ({}));
                throw new Error((b as { message?: string }).message ?? "Save failed");
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────

    const slots = previewSlots();

    return (
        <div>
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
                        <div>
                            <h1 style={{ font: "700 28px 'Figtree',sans-serif", margin: 0 }}>Availability</h1>
                            <p style={{ font: "400 15px 'Figtree',sans-serif", color: "#4f6478", marginTop: "2px" }}>
                                Patients can book only the times you set here. All times are West Africa Time.
                            </p>
                        </div>
                        <button style={{ ...S.btn, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
                            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
                        </button>
                    </div>

                    {error && (
                        <div style={{ marginTop: "12px", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", color: "#b91c1c", font: "14px 'Figtree',sans-serif" }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "20px", alignItems: "flex-start" }}>

                        {/* Left column */}
                        <div style={{ flex: "2 1 520px", display: "grid", gap: "20px" }}>

                            {/* Weekly hours */}
                            <div style={S.card}>
                                <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>Weekly hours</h2>
                                {DAYS.map((dayName, weekday) => {
                                    const on = dayBlocks(weekday).length > 0;
                                    const bs = dayBlocks(weekday);
                                    return (
                                        <div key={weekday} style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "14px 0", borderTop: "1px solid #e4ebf2" }}>
                                            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                                <button
                                                    style={S.tog(on)}
                                                    onClick={() => toggleDay(weekday)}
                                                    aria-label={`Toggle ${dayName}`}
                                                >
                                                    <span style={S.togThumb(on)} />
                                                </button>
                                                <span style={{ width: "100px", font: `600 15px 'Figtree',sans-serif`, color: on ? "#022449" : "#4f6478" }}>
                                                    {dayName}
                                                </span>
                                                {!on && <span style={{ color: "#4f6478", font: "400 14px 'Figtree',sans-serif" }}>Not available</span>}
                                                {on && bs.length === 0 && <span style={{ color: "#4f6478", font: "400 14px 'Figtree',sans-serif" }}>Not available</span>}
                                            </div>
                                            {bs.map((b, idx) => (
                                                <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "center", paddingLeft: "60px", flexWrap: "wrap" }}>
                                                    <select
                                                        value={minutesToTime(b.startMinute)}
                                                        onChange={(e) => updateBlock(weekday, idx, { startMinute: timeToMinutes(e.target.value) })}
                                                        style={S.timeSelect}
                                                    >
                                                        {TIME_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                                                    </select>
                                                    <span style={{ color: "#4f6478", font: "400 14px 'Figtree',sans-serif" }}>to</span>
                                                    <select
                                                        value={minutesToTime(b.endMinute)}
                                                        onChange={(e) => updateBlock(weekday, idx, { endMinute: timeToMinutes(e.target.value) })}
                                                        style={S.timeSelect}
                                                    >
                                                        {TIME_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                                                    </select>
                                                    <select
                                                        value={b.mode}
                                                        onChange={(e) => updateBlock(weekday, idx, { mode: e.target.value as Mode })}
                                                        style={{ ...S.timeSelect, minWidth: "90px" }}
                                                    >
                                                        {(["VIDEO", "HOME", "CHAT"] as Mode[]).map((m) => (
                                                            <option key={m} value={m}>{MODE_LABELS[m]}</option>
                                                        ))}
                                                    </select>
                                                    {bs.length > 1 && (
                                                        <button onClick={() => removeBlock(weekday, idx)} style={{ ...S.btn2, minHeight: "36px", color: "#b91c1c" }}>Remove</button>
                                                    )}
                                                    {idx === bs.length - 1 && (
                                                        <button onClick={() => addBlock(weekday)} style={S.btn2}>Add another time</button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Days off */}
                            <div style={S.card}>
                                <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>Days off</h2>
                                <p style={{ font: "400 14px 'Figtree',sans-serif", color: "#4f6478", marginTop: "2px" }}>
                                    Booked sessions on these days are not removed. You will be asked to move them.
                                </p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px", alignItems: "center" }}>
                                    {daysOff.map((d) => (
                                        <span key={d.id} style={S.chip("warn")}>
                                            {new Date(d.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                                            <button
                                                onClick={() => handleRemoveDayOff(d.id)}
                                                style={{ background: "none", border: 0, color: "#7a4f00", cursor: "pointer", padding: "0 2px", fontSize: "14px", lineHeight: 1 }}
                                                aria-label="Remove day off"
                                            >×</button>
                                        </span>
                                    ))}
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        <input
                                            type="date"
                                            value={addDayOffDate}
                                            onChange={(e) => setAddDayOffDate(e.target.value)}
                                            style={{ ...S.timeSelect, font: "400 13px 'Figtree',sans-serif" }}
                                        />
                                        <button onClick={handleAddDayOff} disabled={!addDayOffDate} style={{ ...S.btn2, opacity: addDayOffDate ? 1 : 0.5 }}>Add</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right column */}
                        <div style={{ flex: "1 1 320px", display: "grid", gap: "20px" }}>

                            {/* Session settings */}
                            <div style={S.card}>
                                <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>Session settings</h2>

                                <div style={{ font: "600 13px 'Figtree',sans-serif", marginTop: "14px", marginBottom: "6px" }}>Session length</div>
                                <div style={S.seg}>
                                    {SESSION_OPTS.map((n) => (
                                        <button key={n} style={S.segItem(settings.sessionMinutes === n)} onClick={() => setSettings((s) => ({ ...s, sessionMinutes: n }))}>
                                            {n} min
                                        </button>
                                    ))}
                                </div>

                                <div style={{ font: "600 13px 'Figtree',sans-serif", marginTop: "14px", marginBottom: "6px" }}>Break between sessions</div>
                                <div style={S.seg}>
                                    {BUFFER_OPTS.map((n) => (
                                        <button key={n} style={S.segItem(settings.bufferMinutes === n)} onClick={() => setSettings((s) => ({ ...s, bufferMinutes: n }))}>
                                            {n === 0 ? "None" : `${n} min`}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ font: "600 13px 'Figtree',sans-serif", marginTop: "14px", marginBottom: "6px" }}>Visit types you offer</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {(["VIDEO", "CHAT", "HOME"] as Mode[]).map((m) => {
                                        const on = settings.sessionTypes.includes(m);
                                        return (
                                            <button
                                                key={m}
                                                style={{ ...S.chip(on ? "ok" : undefined), cursor: "pointer", border: 0 }}
                                                onClick={() =>
                                                    setSettings((s) => ({
                                                        ...s,
                                                        sessionTypes: on
                                                            ? s.sessionTypes.filter((x) => x !== m)
                                                            : [...s.sessionTypes, m],
                                                    }))
                                                }
                                            >
                                                {MODE_LABELS[m]}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #e4ebf2" }}>
                                    <button
                                        style={S.tog(settings.acceptingPatients)}
                                        onClick={() => setSettings((s) => ({ ...s, acceptingPatients: !s.acceptingPatients }))}
                                        aria-label="Toggle accepting patients"
                                    >
                                        <span style={S.togThumb(settings.acceptingPatients)} />
                                    </button>
                                    <div>
                                        <div style={{ font: "600 14px 'Figtree',sans-serif" }}>Accepting new patients</div>
                                        <div style={{ font: "400 12px 'Figtree',sans-serif", color: "#4f6478" }}>Turn off to pause. Current patients can still book.</div>
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            <div style={S.card}>
                                <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>What patients will see</h2>
                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                                    {DAYS.map((d, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPreviewDay(i)}
                                            style={{
                                                padding: "4px 10px", borderRadius: "99px", font: "600 12px 'Figtree',sans-serif",
                                                background: previewDay === i ? "#1b7d0e" : "#eef3f8",
                                                color: previewDay === i ? "#fff" : "#022449", border: 0, cursor: "pointer",
                                            }}
                                        >
                                            {d.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                                <p style={{ font: "400 14px 'Figtree',sans-serif", color: "#4f6478", marginTop: "8px" }}>
                                    {DAYS[previewDay]}, {settings.sessionMinutes} minute sessions
                                </p>
                                {slots.length === 0 ? (
                                    <p style={{ font: "400 13px 'Figtree',sans-serif", color: "#7d93a8", marginTop: "10px" }}>Not available this day.</p>
                                ) : (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                                        {slots.map((s, i) => (
                                            <span key={i} style={S.slot(s.busy)}>{s.time}</span>
                                        ))}
                                    </div>
                                )}
                                <p style={{ font: "400 12px/1.5 'Figtree',sans-serif", color: "#4f6478", marginTop: "10px" }}>
                                    Crossed out times are already booked or held for a patient who is paying.
                                </p>
                            </div>
                        </div>
                    </div>
        </div>
    );
}
