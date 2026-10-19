"use client";

import { DailyProvider, useDaily, useParticipantIds, DailyVideo, useLocalSessionId, useDailyEvent } from "@daily-co/daily-react";
import { useEffect } from "react";

export function DailyCallFrame({ url, token }: { url: string; token: string }) {
    return (
        <DailyProvider url={url} token={token} dailyConfig={{ useDevicePreferenceCookies: true }}>
            <CallContent />
        </DailyProvider>
    );
}

function CallContent() {
    const daily = useDaily();
    const localId = useLocalSessionId();
    const remoteIds = useParticipantIds({ filter: "remote" });

    useDailyEvent("left-meeting", () => {
        // The parent handles navigation.
    });

    useEffect(() => {
        daily?.join().catch(() => {
            // Parent surfaces the error.
        });
        return () => {
            void daily?.leave();
        };
    }, [daily]);

    return (
        <div className="relative h-full w-full bg-black">
            {remoteIds.length > 0 ? (
                remoteIds.map((id) => (
                    <DailyVideo key={id} sessionId={id} type="video" automirror={false} className="h-full w-full object-cover" />
                ))
            ) : (
                <div className="flex h-full items-center justify-center text-neutral-400">
                    Waiting for the other person to join…
                </div>
            )}

            {localId && (
                <div className="absolute bottom-4 right-4 h-32 w-24 overflow-hidden rounded-lg shadow-lg">
                    <DailyVideo sessionId={localId} type="video" automirror className="h-full w-full object-cover" />
                </div>
            )}
        </div>
    );
}