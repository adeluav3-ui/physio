"use client";

import {
    DailyProvider,
    useDaily,
    useParticipantIds,
    DailyVideo,
    useLocalSessionId,
    useDailyEvent,
} from "@daily-co/daily-react";
import { useEffect } from "react";

interface DailyCallFrameProps {
    url: string;
    token: string;
    micOn?: boolean;
    cameraOn?: boolean;
}

export function DailyCallFrame({ url, token, micOn = true, cameraOn = true }: DailyCallFrameProps) {
    return (
        <DailyProvider url={url} token={token} dailyConfig={{ useDevicePreferenceCookies: true }}>
            <CallContent micOn={micOn} cameraOn={cameraOn} />
        </DailyProvider>
    );
}

function CallContent({ micOn, cameraOn }: { micOn: boolean; cameraOn: boolean }) {
    const daily = useDaily();
    const localId = useLocalSessionId();
    const remoteIds = useParticipantIds({ filter: "remote" });

    useDailyEvent("left-meeting", () => {
        // The parent handles navigation.
    });

    useEffect(() => {
        // Join with initial device state; ongoing changes handled by effects below.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        daily?.join({ startAudioOff: !micOn, startVideoOff: !cameraOn });
        return () => {
            void daily?.leave();
        };
        // micOn / cameraOn intentionally excluded: only used at join time.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [daily]);

    // Sync mic after joining (localId becomes non-null once we're in the room).
    useEffect(() => {
        if (!localId || !daily) return;
        daily.setLocalAudio(micOn);
    }, [daily, localId, micOn]);

    // Sync camera after joining.
    useEffect(() => {
        if (!localId || !daily) return;
        daily.setLocalVideo(cameraOn);
    }, [daily, localId, cameraOn]);

    return (
        <div className="relative h-full w-full bg-black">
            {remoteIds.length > 0 ? (
                remoteIds.map((id) => (
                    <DailyVideo
                        key={id}
                        sessionId={id}
                        type="video"
                        automirror={false}
                        className="h-full w-full object-cover"
                    />
                ))
            ) : (
                <div className="flex h-full items-center justify-center text-neutral-400">
                    Waiting for the other person to join…
                </div>
            )}

            {localId && (
                <div className="absolute bottom-4 right-4 h-32 w-24 overflow-hidden rounded-lg shadow-lg">
                    <DailyVideo
                        sessionId={localId}
                        type="video"
                        automirror
                        className="h-full w-full object-cover"
                    />
                </div>
            )}
        </div>
    );
}
