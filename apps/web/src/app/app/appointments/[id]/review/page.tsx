"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const NAV = "#022449";
const GREEN = "#1b7d0e";
const MUTED = "#4f6478";
const BORDER = "#d9e3ec";

export default function AppointmentReviewPage() {
    const params = useParams<{ id: string }>();
    const appointmentId = params.id;

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [existing, setExisting] = useState<{ rating: number; comment: string | null } | null>(null);
    const [done, setDone] = useState(false);

    useEffect(() => {
        fetch(`/api/proxy/reviews/appointments/${appointmentId}`, { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .then((r) => {
                if (r) {
                    setExisting(r);
                    setRating(r.rating);
                    setComment(r.comment ?? "");
                }
            });
    }, [appointmentId]);

    async function submit() {
        if (rating === 0) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(`/api/proxy/reviews/appointments/${appointmentId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ rating, ...(comment.trim() && { comment: comment.trim() }) }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((body as { message?: string }).message ?? "Could not submit review");
            }
            setDone(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : "An error occurred.");
        } finally {
            setSubmitting(false);
        }
    }

    if (done) {
        return (
            <div style={{ maxWidth: 480, margin: "60px auto", padding: "32px", textAlign: "center", background: "#fff", borderRadius: 10, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <h2 style={{ color: GREEN, marginBottom: 8 }}>Thank you</h2>
                <p style={{ color: MUTED, marginBottom: 24 }}>Your review has been submitted.</p>
                <Link
                    href="/app/appointments"
                    style={{ display: "inline-block", background: NAV, color: "#fff", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}
                >
                    Back to appointments
                </Link>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
            <div style={{ marginBottom: 20 }}>
                <Link href="/app/appointments" style={{ color: NAV, textDecoration: "none", fontSize: 14 }}>← Back to appointments</Link>
            </div>

            <h1 style={{ color: NAV, fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                {existing ? "Update your review" : "Rate your session"}
            </h1>
            <p style={{ color: MUTED, fontSize: 14, marginBottom: 24 }}>How did your session go?</p>

            <div style={{ background: "#fff", padding: 24, borderRadius: 10, border: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAV, marginBottom: 10 }}>Your rating</label>
                    <div style={{ display: "flex", gap: 8 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <button
                                key={n}
                                onClick={() => setRating(n)}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 8,
                                    border: `2px solid ${rating >= n ? NAV : BORDER}`,
                                    background: rating >= n ? NAV : "#fff",
                                    color: rating >= n ? "#fff" : MUTED,
                                    fontSize: 20,
                                    cursor: "pointer",
                                    transition: "all 0.1s",
                                }}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    {rating > 0 && (
                        <p style={{ marginTop: 6, fontSize: 13, color: MUTED }}>
                            {["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}
                        </p>
                    )}
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAV, marginBottom: 6 }}>
                        Comment <span style={{ color: MUTED, fontWeight: 400 }}>(optional)</span>
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Anything you would like to share about your experience?"
                        rows={4}
                        maxLength={2000}
                        style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "8px 12px", fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                    />
                </div>

                {error && <p style={{ color: "#b91c1c", fontSize: 14, margin: 0 }}>{error}</p>}

                <button
                    onClick={() => void submit()}
                    disabled={submitting || rating === 0}
                    style={{
                        padding: "12px 0",
                        background: NAV,
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: 15,
                        cursor: "pointer",
                        opacity: submitting || rating === 0 ? 0.5 : 1,
                        width: "100%",
                    }}
                >
                    {submitting ? "Submitting…" : existing ? "Update review" : "Submit review"}
                </button>
            </div>
        </div>
    );
}
