"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DailyCallFrame } from "@/components/daily-call";
import { VideoCallLayout } from "@/components/video-call-layout";

type JoinResponse = { roomId: string; roomUrl: string; token: string; role: "PATIENT" | "PHYSIO" };

export default function PatientSessionPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const [join, setJoin] = useState<JoinResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);

    useEffect(() => {
        fetch(`/api/proxy/sessions/${params.id}/join`, { method: "POST" })
            .then(async (r) => {
                if (!r.ok) {
                    const b = await r.json();
                    throw new Error(b.message ?? "Could not join");
                }
                return r.json();
            })
            .then(setJoin)
            .catch((e) => setError((e as Error).message));
    }, [params.id]);

    function onLeave() {
        router.push(`/app/appointments/${params.id}`);
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6 text-center">
                <div>
                    <p className="text-lg font-semibold">Can't join right now</p>
                    <p className="mt-2 text-sm text-text-muted">{error}</p>
                    <button onClick={onLeave} className="mt-6 text-primary-600 underline">Go back</button>
                </div>
            </div>
        );
    }

    if (!join) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-sm text-text-muted">Joining session…</p>
            </div>
        );
    }

    return (
        <VideoCallLayout
            role="PATIENT"
            videoSlot={<DailyCallFrame url={join.roomUrl} token={join.token} />}
            controls={{
                micOn,
                cameraOn,
                onToggleMic: () => setMicOn((v) => !v),
                onToggleCamera: () => setCameraOn((v) => !v),
                onLeave,
            }}
        />
    );
}