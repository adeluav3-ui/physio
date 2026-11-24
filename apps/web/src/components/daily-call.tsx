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
    screenShareOn?: boolean;
    onScreenShareStop?: () => void;
    chatOpen?: boolean;
    onUnreadMessage?: () => void;
}

export function DailyCallFrame({ url, token, micOn = true, cameraOn = true, screenShareOn = false, onScreenShareStop, chatOpen, onUnreadMessage }: DailyCallFrameProps) {
    return (
        <DailyProvider
            url={url}
            token={token}
            dailyConfig={{
                useDevicePreferenceCookies: true,
            }}
        >
            <CallContent micOn={micOn} cameraOn={cameraOn} screenShareOn={screenShareOn} onScreenShareStop={onScreenShareStop} chatOpen={chatOpen ?? false} onUnreadMessage={onUnreadMessage} />
        </DailyProvider>
    );
}

function CallContent({ micOn, cameraOn, screenShareOn, onScreenShareStop, chatOpen, onUnreadMessage }: {
    micOn: boolean;
    cameraOn: boolean;
    screenShareOn: boolean;
    onScreenShareStop: (() => void) | undefined;
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
    const onScreenShareStopRef = useRef(onScreenShareStop);

    useEffect(() => { onUnreadRef.current = onUnreadMessage; }, [onUnreadMessage]);
    useEffect(() => { onScreenShareStopRef.current = onScreenShareStop; }, [onScreenShareStop]);

    useDailyEvent("left-meeting", () => {
        // The parent handles navigation.
    });

    // Browser-side stop (user clicks "Stop sharing" in OS/browser prompt).
    useDailyEvent("local-screen-share-stopped", () => {
        onScreenShareStopRef.current?.();
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

    // Sync screen share: start when prop flips on, stop when it flips off.
    useEffect(() => {
        if (!localId || !daily) return;
        if (screenShareOn) {
            void daily.startScreenShare();
        } else {
            void daily.stopScreenShare();
        }
    }, [daily, localId, screenShareOn]);

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

            {/* In-session chat — bottom sheet */}
            {chatOpen && (
                <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    height: "52%", minHeight: 260, maxHeight: 420,
                    background: "rgba(10, 20, 36, 0.94)",
                    backdropFilter: "blur(16px)",
                    display: "flex", flexDirection: "column",
                    fontFamily: "'Figtree', system-ui, sans-serif",
                    borderTop: "1px solid rgba(255,255,255,0.12)",
                    zIndex: 10,
                }}>
                    {/* Header */}
                    <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", font: "600 13px 'Figtree', sans-serif", color: "rgba(255,255,255,0.7)", flexShrink: 0, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                        Chat
                    </div>
                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                        {messages.length === 0 && (
                            <div style={{ font: "400 13px 'Figtree', sans-serif", color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 32 }}>
                                No messages yet.
                            </div>
                        )}
                        {messages.map((m) => (
                            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.fromLocal ? "flex-end" : "flex-start" }}>
                                <div style={{
                                    maxWidth: "78%", padding: "9px 14px",
                                    borderRadius: m.fromLocal ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                    background: m.fromLocal ? "#1b7d0e" : "rgba(255,255,255,0.14)",
                                    color: "#fff",
                                    font: "400 14px/1.45 'Figtree', sans-serif",
                                    wordBreak: "break-word",
                                }}>
                                    {m.text}
                                </div>
                                <span style={{ font: "400 11px 'Figtree', sans-serif", color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{m.time}</span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    {/* Input */}
                    <div style={{ padding: "10px 14px 14px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: 10, flexShrink: 0, alignItems: "center" }}>
                        <input
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            placeholder="Message…"
                            style={{ flex: 1, border: "1px solid rgba(255,255,255,0.18)", borderRadius: 24, padding: "10px 16px", font: "14px 'Figtree', sans-serif", color: "#fff", outline: "none", background: "rgba(255,255,255,0.1)", minWidth: 0 }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!draft.trim()}
                            aria-label="Send"
                            style={{ width: 44, height: 44, borderRadius: "50%", background: draft.trim() ? "#1b7d0e" : "rgba(255,255,255,0.1)", color: "#fff", fontSize: 20, border: 0, cursor: draft.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
                        >
                            ↑
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
