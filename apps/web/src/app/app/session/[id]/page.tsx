"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DailyCallFrame } from "@/components/daily-call";

type JoinData = { roomUrl: string; token: string; appointment: { id: string; startsAt: string; endsAt: string } };

const NAV = "#022449";
const GREEN = "#1b7d0e";
const MUTED = "#4f6478";

export default function PatientSessionPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();

    const [phase, setPhase] = useState<"check" | "joining" | "in-session" | "error">("check");
    const [join, setJoin] = useState<JoinData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [camOk, setCamOk] = useState<boolean | null>(null);
    const [micOk, setMicOk] = useState<boolean | null>(null);
    const [netOk] = useState(true);

    // Check devices on mount
    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((s) => {
                s.getTracks().forEach((t) => t.stop());
                setCamOk(true);
                setMicOk(true);
            })
            .catch(() => {
                setCamOk(false);
                setMicOk(false);
            });
    }, []);

    function joinSession(audioOnly = false) {
        setPhase("joining");
        fetch(`/api/proxy/sessions/${params.id}/join`, { method: "POST" })
            .then(async (r) => {
                if (!r.ok) {
                    const b = await r.json().catch(() => ({}));
                    throw new Error((b as { message?: string }).message ?? "Could not join");
                }
                return r.json() as Promise<JoinData>;
            })
            .then((j) => {
                setJoin(j);
                setPhase("in-session");
                void audioOnly;
            })
            .catch((e) => {
                setError((e as Error).message);
                setPhase("error");
            });
    }

    async function leaveSession() {
        await fetch(`/api/proxy/sessions/${params.id}/end`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        }).catch(() => {});
        router.push(`/app/appointments/${params.id}`);
    }

    function statusChip(ok: boolean | null) {
        if (ok === null) return { label: "Checking…", bg: "#eef3f8", color: MUTED };
        if (ok) return { label: "Working", bg: "#e3f4e8", color: "#1d5c34" };
        return { label: "Issue detected", bg: "#fee2e2", color: "#b91c1c" };
    }

    if (phase === "error") {
        return (
            <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Figtree', system-ui, sans-serif", textAlign: "center" }}>
                <div>
                    <p style={{ fontSize: 17, fontWeight: 600, color: NAV }}>Can't join right now</p>
                    <p style={{ marginTop: 8, fontSize: 14, color: MUTED }}>{error}</p>
                    <button onClick={() => router.push(`/app/appointments/${params.id}`)} style={{ marginTop: 24, color: "#076889", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>Go back</button>
                </div>
            </div>
        );
    }

    if (phase === "in-session" && join) {
        const cam = statusChip(null);
        const mic = statusChip(null);
        void cam; void mic;
        return (
            <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", background: NAV, fontFamily: "'Figtree', system-ui, sans-serif" }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <DailyCallFrame url={join.roomUrl} token={join.token} />
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, padding: "20px 0 24px", background: NAV }}>
                    {[
                        { label: "Mute" },
                        { label: "Camera" },
                        { label: "Chat" },
                    ].map((c) => (
                        <div key={c.label} style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", color: NAV, border: "1px solid #c3d1de", font: "600 12px 'Figtree', sans-serif", textAlign: "center", cursor: "pointer" }}>
                            {c.label}
                        </div>
                    ))}
                    <button
                        onClick={leaveSession}
                        style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#b42318", color: "#fff", border: "none", font: "600 12px 'Figtree', sans-serif", cursor: "pointer" }}
                    >
                        End
                    </button>
                </div>
            </div>
        );
    }

    // Waiting room / device check
    const camChip = statusChip(camOk);
    const micChip = statusChip(micOk);
    const netChip = statusChip(netOk);
    const isJoining = phase === "joining";

    return (
        <div style={{ minHeight: "100vh", background: "#e9eff5", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "'Figtree', system-ui, sans-serif" }}>
            <div style={{ width: "100%", maxWidth: 420, background: "#f4f8fb", borderRadius: 24, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                    <h1 style={{ font: "700 26px 'Figtree', sans-serif", color: NAV, margin: 0 }}>Almost time</h1>
                    <p style={{ font: "400 16px 'Figtree', sans-serif", color: MUTED, margin: 0, marginTop: -8 }}>
                        Your session is about to start.
                    </p>

                    {/* Camera preview placeholder */}
                    <div style={{ height: 200, borderRadius: 16, background: "#cdddea", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED }}>
                        <span style={{ font: "500 15px 'Figtree', sans-serif" }}>Your camera preview</span>
                    </div>

                    {/* Device status */}
                    <div style={{ background: "#fff", border: "1px solid #d9e3ec", borderRadius: 16, padding: 16, display: "grid", gap: 10, font: "500 15px 'Figtree', sans-serif" }}>
                        {[
                            { label: "Camera", chip: camChip },
                            { label: "Microphone", chip: micChip },
                            { label: "Connection", chip: netChip },
                        ].map(({ label, chip: c }) => (
                            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span>{label}</span>
                                <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 99, font: "600 12px 'Figtree', sans-serif", background: c.bg, color: c.color }}>
                                    {c.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <p style={{ font: "400 14px/1.5 'Figtree', sans-serif", color: MUTED, margin: 0 }}>
                        Weak connection? You can switch to audio only, or message your specialist.
                    </p>

                    <div style={{ display: "grid", gap: 10, marginTop: "auto" }}>
                        <button
                            onClick={() => joinSession(false)}
                            disabled={isJoining}
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 50, borderRadius: 12, background: isJoining ? "#999" : GREEN, color: "#fff", font: "600 16px 'Figtree', sans-serif", border: 0, cursor: isJoining ? "not-allowed" : "pointer" }}
                        >
                            {isJoining ? "Joining…" : "Join session"}
                        </button>
                        <button
                            onClick={() => joinSession(true)}
                            disabled={isJoining}
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 50, borderRadius: 12, background: "#fff", color: NAV, border: "1px solid #c3d1de", font: "600 16px 'Figtree', sans-serif", cursor: isJoining ? "not-allowed" : "pointer" }}
                        >
                            Audio only
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
