"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

type Message = { id: string; body: string; senderId: string; createdAt: string };
type Thread = { id: string; professional: { id: string; user: { name: string; id: string } }; messages: Message[] };

export default function MessageThreadPage() {
    const { id } = useParams<{ id: string }>();
    const [thread, setThread] = useState<Thread | null>(null);
    const [text, setText] = useState("");
    const [me, setMe] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/proxy/auth/me").then(r => r.ok ? r.json() : null).then(d => d && setMe(d.id)).catch(() => {});
        fetch(`/api/proxy/messages/threads/${id}`).then(r => r.ok ? r.json() : null).then(d => d && setThread(d)).catch(() => {});
    }, [id]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread?.messages?.length]);

    async function send(e: React.FormEvent) {
        e.preventDefault();
        if (!text.trim()) return;
        await fetch(`/api/proxy/messages/threads/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text }) });
        setText("");
        const updated = await fetch(`/api/proxy/messages/threads/${id}`).then(r => r.ok ? r.json() : null);
        if (updated) setThread(updated);
    }

    const proName = thread?.professional.user.name ?? "[Professional name]";

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100dvh", fontFamily: "'Figtree',system-ui,sans-serif", color: "#022449", background: "#f4f8fb" }}>
            {/* Header */}
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #d9e3ec", background: "#fff", display: "flex", gap: "12px", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#cfe3ee", flexShrink: 0 }}></div>
                <div>
                    <div style={{ font: "700 16px 'Figtree',sans-serif" }}>{proName}</div>
                    <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif" }}>Physiotherapist</div>
                </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" }}>
                {(!thread?.messages?.length) && (
                    <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif", textAlign: "center" }}>No messages yet.</div>
                )}
                {thread?.messages?.map(msg => {
                    const isMine = msg.senderId === me;
                    return (
                        <div key={msg.id} className="msg" style={{ background: isMine ? "#1b7d0e" : "#fff", color: isMine ? "#fff" : "#022449", border: isMine ? "none" : "1px solid #d9e3ec", alignSelf: isMine ? "flex-end" : "flex-start" }}>
                            {msg.body}
                        </div>
                    );
                })}
                <div className="muted" style={{ font: "400 12px 'Figtree',sans-serif", textAlign: "center", marginTop: "6px" }}>Messages are for care questions. For emergencies, go to a hospital.</div>
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={send} style={{ padding: "12px 16px", borderTop: "1px solid #d9e3ec", background: "#fff", display: "flex", gap: "10px", flexShrink: 0 }}>
                <input aria-label="Write a message" placeholder="Write a message" value={text} onChange={e => setText(e.target.value)} style={{ flex: 1, minHeight: "46px", border: "1px solid #b4c4d3", borderRadius: "23px", padding: "0 16px", font: "15px 'Figtree',sans-serif", outline: "none" }} />
                <button type="submit" className="btn" style={{ width: "70px", minHeight: "46px", borderRadius: "23px" }}>Send</button>
            </form>
        </div>
    );
}
