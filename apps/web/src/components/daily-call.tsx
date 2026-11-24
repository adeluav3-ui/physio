"use client";

import {
    DailyProvider,
    useDaily,
    useParticipantIds,
    DailyVideo,
    DailyAudio,
    useLocalSessionId,
    useDailyEvent,
} from "@daily-co/daily-react";
import { useEffect, useRef, useState } from "react";

interface ChatMessage {
    id: string;
    text: string;
    fromLocal: boolean;
    time: string;
}

interface DailyCallFrameProps {
    url: string;
    token: string;
    micOn?: boolean;
    cameraOn?: boolean;
    chatOpen?: boolean;
    onUnreadMessage?: () => void;
}

export function DailyCallFrame({ url, token, micOn = true, cameraOn = true, chatOpen, onUnreadMessage }: DailyCallFrameProps) {
    return (
        <DailyProvider
            url={url}
            token={token}
            dailyConfig={{
                useDevicePreferenceCookies: true,
            }}
        >
            <CallContent micOn={micOn} cameraOn={cameraOn} chatOpen={chatOpen ?? false} onUnreadMessage={onUnreadMessage} />
        </DailyProvider>
    );
}

function CallContent({ micOn, cameraOn, chatOpen, onUnreadMessage }: {
    micOn: boolean;
    cameraOn: boolean;
    chatOpen: boolean;
    onUnreadMessage: (() => void) | undefined;
}) {
    const daily = useDaily();
    const localId = useLocalSessionId();
    const remoteIds = useParticipantIds({ filter: "remote" });
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [draft, setDraft] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const onUnreadRef = useRef(onUnreadMessage);

    useEffect(() => { onUnreadRef.current = onUnreadMessage; }, [onUnreadMessage]);

    useDailyEvent("left-meeting", () => {
        // The parent handles navigation.
    });

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        daily?.join({ startAudioOff: !micOn, startVideoOff: !cameraOn });
        return () => {
            void daily?.leave();
        };
        // micOn / cameraOn intentionally excluded: only used at join time.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [daily]);

    // Sync mic after joining.
    useEffect(() => {
        if (!localId || !daily) return;
        daily.setLocalAudio(micOn);
    }, [daily, localId, micOn]);

    // Sync camera after joining.
    useEffect(() => {
        if (!localId || !daily) return;
        daily.setLocalVideo(cameraOn);
    }, [daily, localId, cameraOn]);

    // Receive in-session messages from the other participant.
    useDailyEvent("app-message", (evt) => {
        const data = (evt as { data?: { text?: string } }).data;
        if (typeof data?.text === "string") {
            setMessages((prev) => [...prev, {
                id: `${Date.now()}-${Math.random()}`,
                text: data.text!,
                fromLocal: false,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }]);
            onUnreadRef.current?.();
        }
    });

    // Auto-scroll when chat opens or new message arrives.
    useEffect(() => {
        if (chatOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, chatOpen]);

    function sendMessage() {
        const text = draft.trim();
        if (!text || !daily) return;
        daily.sendAppMessage({ text }, "*");
        setMessages((prev) => [...prev, {
            id: `${Date.now()}-local`,
            text,
            fromLocal: true,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
        setDraft("");
    }

    return (
        <div className="relative h-full w-full bg-black">
            {/* DailyAudio renders an <audio> element for every remote participant */}
            <DailyAudio />

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

            {/* In-session chat panel */}
            {chatOpen && (
                <div style={{
                    position: "absolute", top: 0, right: 0, bottom: 0, width: 280,
                    background: "rgba(255,255,255,0.97)", display: "flex", flexDirection: "column",
                    fontFamily: "'Figtree', system-ui, sans-serif",
                    boxShadow: "-4px 0 20px rgba(0,0,0,0.35)", zIndex: 10,
                }}>
                    <div style={{ padding: "12px 14px", borderBottom: "1px solid #d9e3ec", font: "700 14px 'Figtree', sans-serif", color: "#022449", flexShrink: 0 }}>
                        In-session chat
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                        {messages.length === 0 && (
                            <div style={{ font: "400 13px 'Figtree', sans-serif", color: "#4f6478", textAlign: "center", marginTop: 40 }}>
                                No messages yet.
                            </div>
                        )}
                        {messages.map((m) => (
                            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.fromLocal ? "flex-end" : "flex-start" }}>
                                <div style={{
                                    maxWidth: "85%", padding: "8px 12px",
                                    borderRadius: m.fromLocal ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                                    background: m.fromLocal ? "#1b7d0e" : "#eef3f8",
                                    color: m.fromLocal ? "#fff" : "#022449",
                                    font: "400 13px/1.4 'Figtree', sans-serif",
                                }}>
                                    {m.text}
                                </div>
                                <span style={{ font: "400 11px 'Figtree', sans-serif", color: "#4f6478", marginTop: 2 }}>{m.time}</span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div style={{ padding: "10px 12px", borderTop: "1px solid #d9e3ec", display: "flex", gap: 8, flexShrink: 0 }}>
                        <input
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            placeholder="Type a message…"
                            style={{ flex: 1, border: "1px solid #c3d1de", borderRadius: 10, padding: "8px 10px", font: "14px 'Figtree', sans-serif", color: "#022449", outline: "none" }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!draft.trim()}
                            style={{ padding: "8px 14px", borderRadius: 10, background: draft.trim() ? "#1b7d0e" : "#9db8a0", color: "#fff", font: "600 13px 'Figtree', sans-serif", border: 0, cursor: draft.trim() ? "pointer" : "not-allowed" }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
