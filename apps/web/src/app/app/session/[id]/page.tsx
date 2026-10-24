"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DailyCallFrame } from "@/components/daily-call";
import { VideoCallLayout } from "@/components/video-call-layout";

type JoinResponse = { roomId: string; roomUrl: string; token: string; role: "PATIENT" | "PHYSIO" };
type Appt = { id: string; startsAt: string; physio: { user: { name: string } } };

export default function PatientSessionPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [join, setJoin] = useState<JoinResponse | null>(null);
    const [appt, setAppt] = useState<Appt | null>(null);
    const [stage, setStage] = useState<"waiting" | "joined">("waiting");
    const [error, setError] = useState<string | null>(null);
    const [audioOnly, setAudioOnly] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);

    useEffect(() => {
        fetch(`/api/proxy/booking/appointments/${id}`).then(r => r.ok ? r.json() : null).then(d => d && setAppt(d)).catch(() => {});
    }, [id]);

    async function joinSession() {
        try {
            const r = await fetch(`/api/proxy/sessions/${id}/join`, { method: "POST" });
            if (!r.ok) { const b = await r.json(); throw new Error(b.message ?? "Could not join"); }
            const data = await r.json();
            setJoin(data);
            setStage("joined");
        } catch (e) { setError((e as Error).message); }
    }

    const proName = appt?.physio.user.name ?? "[Professional name]";
    const timeLabel = appt ? new Date(appt.startsAt).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" }) : "your session time";

    if (error) {
        return (
            <div style={{ maxWidth: "430px", margin: "0 auto", padding: "28px 24px", fontFamily: "'Figtree',system-ui,sans-serif", minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                <p style={{ font: "600 18px 'Figtree',sans-serif", margin: 0 }}>{"Can't join right now"}</p>
                <p className="muted" style={{ font: "400 15px 'Figtree',sans-serif", margin: 0 }}>{error}</p>
                <button type="button" className="btn btn2" onClick={() => router.push(`/app/appointments/${id}`)}>Go back</button>
            </div>
        );
    }

    if (stage === "joined" && join) {
        return (
            <VideoCallLayout
                role="PATIENT"
                videoSlot={<DailyCallFrame url={join.roomUrl} token={join.token} />}
                controls={{ micOn, cameraOn, onToggleMic: () => setMicOn(v => !v), onToggleCamera: () => setCameraOn(v => !v), onLeave: () => router.push(`/app/appointments/${id}`) }}
            />
        );
    }

    /* Waiting room */
    return (
        <div style={{ maxWidth: "430px", margin: "0 auto", padding: "28px 24px", fontFamily: "'Figtree',system-ui,sans-serif", minHeight: "100dvh", display: "flex", flexDirection: "column", gap: "16px", background: "#f6f8f7", color: "#12302c" }}>
            <h1 style={{ font: "700 26px 'Figtree',sans-serif", margin: 0 }}>Almost time</h1>
            <p className="muted" style={{ font: "400 16px 'Figtree',sans-serif", marginTop: "-8px" }}>Your session with {proName} starts at {timeLabel}.</p>
            <div style={{ height: "240px", borderRadius: "16px", background: "#cfe0dd", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f6663" }}>
                <span style={{ font: "500 15px 'Figtree',sans-serif" }}>Your camera preview</span>
            </div>
            <div className="card" style={{ display: "grid", gap: "10px", font: "500 15px 'Figtree',sans-serif" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Camera</span><span className="chip-sm ok">Working</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Microphone</span><span className="chip-sm ok">Working</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Connection</span><span className="chip-sm ok">Good</span></div>
            </div>
            <p className="muted" style={{ font: "400 14px/1.5 'Figtree',sans-serif" }}>Weak connection? You can switch to audio only, or message your specialist.</p>
            <div style={{ marginTop: "auto", display: "grid", gap: "10px" }}>
                <button type="button" className="btn" style={{ display: "flex", minHeight: "50px", borderRadius: "12px" }} onClick={joinSession}>Join session</button>
                <button type="button" className="btn btn2" style={{ minHeight: "50px", borderRadius: "12px" }} onClick={() => { setAudioOnly(true); joinSession(); }}>Audio only</button>
            </div>
        </div>
    );
}
