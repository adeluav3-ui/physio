"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DailyCallFrame } from "@/components/daily-call";
import { VideoCallLayout } from "@/components/video-call-layout";
import { Button } from "@physio/ui";

type JoinResponse = { roomId: string; roomUrl: string; token: string; role: "PATIENT" | "PHYSIO" };

export default function PhysioSessionPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const [join, setJoin] = useState<JoinResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [notes, setNotes] = useState("");

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

    async function onLeave() {
        await fetch(`/api/proxy/sessions/${params.id}/end`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        router.push(`/pro/session/${params.id}/note`);
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6 text-center">
                <div>
                    <p className="text-lg font-semibold">Can't join right now</p>
                    <p className="mt-2 text-sm text-text-muted">{error}</p>
                    <button onClick={() => router.push("/pro")} className="mt-6 text-primary-600 underline">Go back</button>
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
            role="PHYSIO"
            videoSlot={<DailyCallFrame url={join.roomUrl} token={join.token} />}
            toolsSlot={
                <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold text-white">Quick notes</h3>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Jot observations during the session…"
                        className="h-48 w-full rounded-md border border-neutral-700 bg-neutral-900 p-3 text-sm text-white placeholder:text-neutral-500"
                    />
                    <p className="text-xs text-neutral-400">
                        These notes are scratch pad only — the SOAP note is captured after the session.
                    </p>
                </div>
            }
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