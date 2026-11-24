"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { DailyCallFrame } from "@/components/daily-call";

const ExerciseViewer = dynamic(() => import("@/components/exercise-viewer"), { ssr: false });

type JoinData = { roomUrl: string; token: string; appointment: { id: string; startsAt: string; endsAt: string } };

type DiagnosticExercise = {
    id: string;
    exerciseId: string;
    sentAt: string;
    feel: string | null;
    feedbackAt: string | null;
    exercise: {
        id: string;
        name: string;
        region: string;
        videoUrl: string | null;
        cues: string;
        contraindications: string | null;
        poseKey: string | null;
        poseData: unknown;
    };
};

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
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const previewRef = useRef<HTMLVideoElement>(null);
    const previewStreamRef = useRef<MediaStream | null>(null);
    const [pendingExercise, setPendingExercise] = useState<DiagnosticExercise | null>(null);
    const [dxFeel, setDxFeel] = useState<"easy" | "okay" | "painful" | "">("");
    const [dxPain, setDxPain] = useState(0);
    const [dxNote, setDxNote] = useState("");
    const [dxSubmitting, setDxSubmitting] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

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

    // Live camera preview while on the device-check screen.
    useEffect(() => {
        if (phase !== "check" || camOk !== true) return;
        let cancelled = false;
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
                previewStreamRef.current = stream;
                if (previewRef.current) previewRef.current.srcObject = stream;
            })
            .catch(() => {});
        return () => {
            cancelled = true;
            previewStreamRef.current?.getTracks().forEach((t) => t.stop());
            previewStreamRef.current = null;
        };
    }, [phase, camOk]);

    // Poll for diagnostic exercises sent by the physio during the session
    useEffect(() => {
        if (phase !== "in-session") return;
        const id = params.id;
        let seenIds = new Set<string>();

        const poll = () => {
            fetch(`/api/proxy/sessions/${id}/diagnostic`)
                .then((r) => (r.ok ? (r.json() as Promise<DiagnosticExercise[]>) : []))
                .then((entries) => {
                    // Find the first exercise without feedback that we haven't shown yet
                    const pending = entries.find((e) => !e.feedbackAt && !seenIds.has(e.id));
                    if (pending) {
                        seenIds.add(pending.id);
                        setPendingExercise(pending);
                        setDxFeel("");
                        setDxPain(0);
                        setDxNote("");
                    }
                })
                .catch(() => {});
        };

        poll();
        const timer = setInterval(poll, 4000);
        return () => clearInterval(timer);
    }, [phase, params.id]);

    async function submitDxFeedback() {
        if (!pendingExercise || !dxFeel) return;
        setDxSubmitting(true);
        try {
            await fetch(`/api/proxy/sessions/${params.id}/diagnostic/${pendingExercise.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    feel: dxFeel,
                    ...(dxPain > 0 && { painScore: dxPain }),
                    ...(dxNote.trim() && { feedbackNote: dxNote.trim() }),
                }),
            });
            setPendingExercise(null);
        } finally {
            setDxSubmitting(false);
        }
    }

    function joinSession(audioOnly = false) {
        if (audioOnly) setCameraOn(false);
        previewStreamRef.current?.getTracks().forEach((t) => t.stop());
        previewStreamRef.current = null;
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
        const rawUrl = pendingExercise?.exercise.videoUrl ?? "";
        const isYouTube = rawUrl.length === 11 && !rawUrl.includes("/");
        const isHttpUrl = rawUrl.startsWith("http");
        return (
            <div style={{ display: "flex", height: "100dvh", flexDirection: "column", background: NAV, fontFamily: "'Figtree', system-ui, sans-serif", overflow: "hidden" }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <DailyCallFrame url={join.roomUrl} token={join.token} micOn={micOn} cameraOn={cameraOn} chatOpen={chatOpen} onUnreadMessage={() => setUnreadCount((c) => c + 1)} />
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, padding: "20px 0 24px", background: NAV }}>
                    <button
                        onClick={() => setMicOn((v) => !v)}
                        style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: micOn ? "#fff" : "#fee2e2", color: micOn ? NAV : "#b91c1c", border: micOn ? "1px solid #c3d1de" : "1px solid #b91c1c", font: "600 12px 'Figtree', sans-serif", textAlign: "center", cursor: "pointer" }}>
                        {micOn ? "Mute" : "Unmute"}
                    </button>
                    <button
                        onClick={() => setCameraOn((v) => !v)}
                        style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: cameraOn ? "#fff" : "#fee2e2", color: cameraOn ? NAV : "#b91c1c", border: cameraOn ? "1px solid #c3d1de" : "1px solid #b91c1c", font: "600 12px 'Figtree', sans-serif", textAlign: "center", cursor: "pointer" }}>
                        {cameraOn ? "Camera" : "No cam"}
                    </button>
                    <button
                        onClick={() => { setChatOpen((v) => !v); setUnreadCount(0); }}
                        style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: chatOpen ? "#e6f4e1" : "#fff", color: chatOpen ? "#0f5a08" : NAV, border: chatOpen ? "1px solid #1b7d0e" : "1px solid #c3d1de", font: "600 12px 'Figtree', sans-serif", textAlign: "center", cursor: "pointer", position: "relative" }}
                    >
                        {unreadCount > 0 && !chatOpen ? (
                            <span style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%", background: "#b42318", color: "#fff", font: "700 10px 'Figtree', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        ) : null}
                        Chat
                    </button>
                    <button
                        onClick={leaveSession}
                        style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#b42318", color: "#fff", border: "none", font: "600 12px 'Figtree', sans-serif", cursor: "pointer" }}
                    >
                        End
                    </button>
                </div>

                {/* ── Diagnostic exercise overlay ── */}
                {pendingExercise && (
                    <div style={{
                        position: "fixed", inset: 0, zIndex: 50,
                        background: "rgba(2,36,73,0.72)",
                        display: "flex", alignItems: "flex-end", justifyContent: "center",
                        padding: 16,
                    }}>
                        <div style={{
                            width: "100%", maxWidth: 480,
                            background: "#fff", borderRadius: "24px 24px 16px 16px",
                            overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column",
                        }}>
                            {/* Header */}
                            <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #d9e3ec", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ font: "700 17px 'Figtree', sans-serif", color: NAV }}>
                                        {pendingExercise.exercise.name}
                                    </div>
                                    <div style={{ font: "400 13px 'Figtree', sans-serif", color: MUTED, marginTop: 2 }}>
                                        Your specialist wants you to try this movement
                                    </div>
                                </div>
                                <span style={{ padding: "3px 10px", borderRadius: 99, background: "#eef3f8", font: "600 12px 'Figtree', sans-serif", color: MUTED }}>
                                    {pendingExercise.exercise.region}
                                </span>
                            </div>

                            <div style={{ flex: 1, overflowY: "auto" }}>
                                {/* Animation / video — 3D pose viewer takes priority over YouTube */}
                                {pendingExercise.exercise.poseKey ? (
                                    <div style={{ padding: "12px 20px 0" }}>
                                        <ExerciseViewer
                                            csvId={pendingExercise.exercise.poseKey}
                                            poseOverride={pendingExercise.exercise.poseData ?? undefined}
                                        />
                                    </div>
                                ) : isYouTube ? (
                                    <iframe
                                        src={`https://www.youtube-nocookie.com/embed/${rawUrl}?autoplay=0&rel=0`}
                                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        style={{ width: "100%", height: 220, border: 0, display: "block" }}
                                        title={pendingExercise.exercise.name}
                                    />
                                ) : isHttpUrl ? (
                                    <div style={{ width: "100%", background: "#0a0a0a", display: "flex", justifyContent: "center" }}>
                                        <img
                                            src={rawUrl}
                                            alt={pendingExercise.exercise.name}
                                            style={{ maxHeight: 220, maxWidth: "100%", objectFit: "contain", display: "block" }}
                                        />
                                    </div>
                                ) : null}

                                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                                    {/* Cues */}
                                    <div>
                                        <div style={{ font: "600 12px 'Figtree', sans-serif", color: MUTED, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Instructions</div>
                                        <p style={{ font: "400 15px/1.5 'Figtree', sans-serif", color: NAV, margin: 0 }}>
                                            {pendingExercise.exercise.cues}
                                        </p>
                                    </div>

                                    {pendingExercise.exercise.contraindications && (
                                        <div style={{ background: "#fdf1d8", border: "1px solid #ecd49b", borderRadius: 10, padding: "10px 14px", font: "400 13px/1.4 'Figtree', sans-serif", color: "#5f3f00" }}>
                                            ⚠ {pendingExercise.exercise.contraindications}
                                        </div>
                                    )}

                                    {/* How did it feel */}
                                    <div>
                                        <div style={{ font: "600 13px 'Figtree', sans-serif", color: NAV, marginBottom: 8 }}>
                                            Perform the movement, then tell your specialist how it felt:
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            {(["easy", "okay", "painful"] as const).map((f) => (
                                                <button
                                                    key={f}
                                                    onClick={() => setDxFeel(f)}
                                                    style={{
                                                        flex: 1, padding: "11px 8px", borderRadius: 10, textAlign: "center",
                                                        border: dxFeel === f
                                                            ? `2px solid ${f === "painful" ? "#b91c1c" : f === "easy" ? GREEN : "#c8930a"}`
                                                            : "1.5px solid #c3d1de",
                                                        background: dxFeel === f
                                                            ? (f === "painful" ? "#fee2e2" : f === "easy" ? "#e3f4e8" : "#fdf1d8")
                                                            : "#fff",
                                                        color: dxFeel === f
                                                            ? (f === "painful" ? "#7f1d1d" : f === "easy" ? "#1d5c34" : "#7a4f00")
                                                            : NAV,
                                                        font: "600 14px 'Figtree', sans-serif",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    {f === "easy" ? "Easy" : f === "okay" ? "OK" : "Painful"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pain score (shown only if "painful" or "okay") */}
                                    {(dxFeel === "painful" || dxFeel === "okay") && (
                                        <div>
                                            <div style={{ font: "600 13px 'Figtree', sans-serif", color: NAV, marginBottom: 6 }}>
                                                Pain score: <span style={{ color: dxFeel === "painful" ? "#b91c1c" : NAV }}>{dxPain}/10</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max={10}
                                                value={dxPain}
                                                onChange={(e) => setDxPain(Number(e.target.value))}
                                                style={{ width: "100%", accentColor: dxFeel === "painful" ? "#b91c1c" : GREEN }}
                                            />
                                            <div style={{ display: "flex", justifyContent: "space-between", font: "400 11px 'Figtree', sans-serif", color: MUTED }}>
                                                <span>No pain</span><span>Worst pain</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Optional note */}
                                    <div>
                                        <input
                                            value={dxNote}
                                            onChange={(e) => setDxNote(e.target.value)}
                                            placeholder="Anything else to tell your specialist? (optional)"
                                            style={{ display: "block", width: "100%", border: "1px solid #c3d1de", borderRadius: 10, padding: "10px 12px", font: "14px 'Figtree', sans-serif", color: NAV, background: "#fff" }}
                                        />
                                    </div>

                                    <button
                                        onClick={submitDxFeedback}
                                        disabled={!dxFeel || dxSubmitting}
                                        style={{
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            minHeight: 50, borderRadius: 12,
                                            background: dxFeel && !dxSubmitting ? GREEN : "#9db8a0",
                                            color: "#fff",
                                            font: "600 16px 'Figtree', sans-serif",
                                            border: 0,
                                            cursor: dxFeel && !dxSubmitting ? "pointer" : "not-allowed",
                                            marginBottom: 4,
                                        }}
                                    >
                                        {dxSubmitting ? "Sending…" : "Send feedback to specialist"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Waiting room / device check
    const camChip = statusChip(camOk);
    const micChip = statusChip(micOk);
    const netChip = statusChip(netOk);
    const isJoining = phase === "joining";

    return (
        <div style={{ minHeight: "100dvh", background: "#e9eff5", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 16, fontFamily: "'Figtree', system-ui, sans-serif", overflowY: "auto" }}>
            <div style={{ width: "100%", maxWidth: 420, background: "#f4f8fb", borderRadius: 24, overflow: "hidden", display: "flex", flexDirection: "column", marginBlock: "auto" }}>
                <div style={{ padding: "20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                    <h1 style={{ font: "700 26px 'Figtree', sans-serif", color: NAV, margin: 0 }}>Almost time</h1>
                    <p style={{ font: "400 16px 'Figtree', sans-serif", color: MUTED, margin: 0, marginTop: -8 }}>
                        Your session is about to start.
                    </p>

                    {/* Camera preview */}
                    {camOk === true ? (
                        <video
                            ref={previewRef}
                            autoPlay
                            muted
                            playsInline
                            style={{ height: 160, width: "100%", borderRadius: 16, objectFit: "cover", background: "#000" }}
                        />
                    ) : (
                        <div style={{ height: 120, borderRadius: 16, background: "#cdddea", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED }}>
                            <span style={{ font: "500 15px 'Figtree', sans-serif" }}>
                                {camOk === null ? "Starting camera…" : "Camera unavailable"}
                            </span>
                        </div>
                    )}

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
