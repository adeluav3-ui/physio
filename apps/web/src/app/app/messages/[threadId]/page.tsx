"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Message = {
    id: string;
    senderId: string;
    body: string;
    sentAt: string;
    sender: { name: string; role: string };
    hasRedFlag?: boolean;
};

const NAV = "#022449";
const GREEN = "#1b7d0e";
const MUTED = "#4f6478";
const BORDER = "#d9e3ec";
const GROUND = "#f4f8fb";

export default function PatientThreadPage() {
    const params = useParams<{ threadId: string }>();
    const threadId = params.threadId;

    const [messages, setMessages] = useState<Message[]>([]);
    const [myId, setMyId] = useState<string | null>(null);
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [redFlagShown, setRedFlagShown] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/auth/me", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .then((u) => u && setMyId(u.id));
    }, []);

    const load = () => {
        fetch(`/api/threads/${threadId}/messages`, { credentials: "include" })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((msgs: Message[]) => {
                setMessages(msgs);
                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
            })
            .catch(() => setError("Could not load messages."));
    };

    useEffect(() => { load(); }, [threadId]);

    async function send() {
        if (!body.trim()) return;
        setSending(true);
        setError(null);
        try {
            const res = await fetch(`/api/threads/${threadId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ body: body.trim() }),
            });
            if (!res.ok) throw new Error(await res.text());
            const msg: Message = await res.json();
            setBody("");
            setMessages((prev) => [...prev, msg]);
            if (msg.hasRedFlag) setRedFlagShown(true);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        } catch {
            setError("Could not send message.");
        } finally {
            setSending(false);
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100dvh", maxWidth: 640, margin: "0 auto" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, background: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
                <Link href="/app/messages" style={{ color: NAV, textDecoration: "none", fontSize: 20 }}>←</Link>
                <span style={{ fontWeight: 600, color: NAV }}>Message thread</span>
            </div>

            {redFlagShown && (
                <div style={{ background: "#fef2f2", border: `1px solid #fca5a5`, borderRadius: 6, margin: "8px 16px", padding: "10px 14px", fontSize: 14, color: "#b91c1c" }}>
                    <strong>Important:</strong> If you are experiencing a medical emergency, call emergency services immediately (112 or 199). Your physiotherapist has been notified.
                </div>
            )}

            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {messages.map((m) => {
                    const isMine = m.senderId === myId;
                    return (
                        <div key={m.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                            <div
                                style={{
                                    maxWidth: "75%",
                                    background: isMine ? NAV : GROUND,
                                    color: isMine ? "#fff" : "#1a2a3a",
                                    borderRadius: isMine ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                                    padding: "8px 12px",
                                    fontSize: 14,
                                }}
                            >
                                {!isMine && <div style={{ fontSize: 11, color: isMine ? "#a0b4c8" : MUTED, marginBottom: 2 }}>{m.sender.name}</div>}
                                <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.body}</div>
                                <div style={{ fontSize: 10, color: isMine ? "#a0b4c8" : MUTED, marginTop: 4, textAlign: "right" }}>
                                    {new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {error && <p style={{ padding: "0 16px", color: "#b91c1c", fontSize: 14 }}>{error}</p>}

            <div style={{ padding: "12px 16px", borderTop: `1px solid ${BORDER}`, background: "#fff", display: "flex", gap: 8 }}>
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
                    placeholder="Type a message…"
                    rows={2}
                    style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, resize: "none", fontFamily: "inherit" }}
                />
                <button
                    onClick={() => void send()}
                    disabled={sending || !body.trim()}
                    style={{ background: NAV, color: "#fff", border: "none", borderRadius: 8, padding: "0 18px", fontWeight: 600, cursor: "pointer", opacity: sending || !body.trim() ? 0.5 : 1 }}
                >
                    Send
                </button>
            </div>
        </div>
    );
}
