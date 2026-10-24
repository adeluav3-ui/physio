"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AdminPhysioReviewPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const [noteText, setNoteText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function decide(decision: "VERIFIED" | "REJECTED") {
        setLoading(true); setError(null);
        try {
            const res = await fetch("/api/proxy/physios/admin/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: params.id, decision, reason: noteText || undefined }),
            });
            if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.message ?? "Action failed"); }
            router.push("/admin/physios");
        } catch (err) { setError((err as Error).message); }
        finally { setLoading(false); }
    }

    return (
        <>
            <h1 style={{ font: "700 28px 'Figtree',sans-serif", margin: 0 }}>Review professional</h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "20px", alignItems: "flex-start" }}>
                <div className="card" style={{ flex: "2 1 420px" }}>
                    <div style={{ marginTop: "0px", height: "180px", borderRadius: "12px", background: "#eef3f2", border: "1px dashed #b9c9c5", display: "flex", alignItems: "center", justifyContent: "center" }} className="muted">
                        <span style={{ font: "500 14px 'Figtree',sans-serif" }}>Uploaded licence document</span>
                    </div>
                    <div style={{ marginTop: "18px" }}>
                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>
                            Note (sent to the professional if rejected)
                        </label>
                        <input
                            placeholder="Reason"
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            style={{ display: "block", width: "100%", minHeight: "46px", border: "1px solid #b9c9c5", borderRadius: "10px", padding: "0 12px", font: "15px 'Figtree',sans-serif", background: "#fff", color: "#12302c" }}
                        />
                    </div>
                    {error && <div style={{ color: "#8f1d1d", font: "400 13px 'Figtree',sans-serif", marginTop: "10px" }}>{error}</div>}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "18px" }}>
                        <button type="button" className="btn" disabled={loading} onClick={() => decide("VERIFIED")}>Approve</button>
                        <button type="button" className="btn btn3" disabled={loading} onClick={() => decide("REJECTED")}>Reject</button>
                        <button type="button" className="btn btn2" disabled={loading} onClick={() => router.push("/admin/physios")}>Back to queue</button>
                    </div>
                    <p className="muted" style={{ font: "400 13px/1.5 'Figtree',sans-serif", marginTop: "14px" }}>
                        Confirm the licence number with the Medical Rehabilitation Therapists Board of Nigeria before approving. This action is recorded in the audit log.
                    </p>
                </div>
            </div>
        </>
    );
}
