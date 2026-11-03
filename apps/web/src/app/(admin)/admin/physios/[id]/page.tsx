"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DISCIPLINE_LABELS, ID_TYPE_LABELS, type IdType } from "@physio/shared";

type Profile = {
    userId: string;
    discipline: string;
    licenceNo: string;
    licensingBody: string | null;
    licenceDocUrl: string | null;
    certificateUrl: string | null;
    idType: string | null;
    ninNumber: string | null;
    ninDocUrl: string | null;
    photoUrl: string | null;
    bio: string;
    specialties: string[];
    serviceArea: string;
    sessionTypes: string[];
    createdAt: string;
    user: { name: string; email: string };
};

function DocLink({ url, label }: { url: string | null; label: string }) {
    if (!url) return <span style={{ color: "#b4c4d3", font: "400 13px 'Figtree',sans-serif" }}>Not uploaded</span>;
    const isImage = /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url);
    return (
        <div>
            {isImage && (
                <img src={url} alt={label} style={{ maxWidth: "100%", maxHeight: "160px", borderRadius: "10px", objectFit: "cover", display: "block", marginBottom: "8px", border: "1px solid #d9e3ec" }} />
            )}
            <a href={url} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#1b7d0e", font: "600 13px 'Figtree',sans-serif", textDecoration: "none" }}>
                Open {label}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginTop: "24px" }}>
            <div style={{ font: "700 13px 'Figtree',sans-serif", color: "#1b7d0e", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #d9e3ec", paddingBottom: "6px", marginBottom: "14px" }}>
                {title}
            </div>
            {children}
        </div>
    );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div style={{ marginBottom: "12px" }}>
            <div style={{ font: "500 12px 'Figtree',sans-serif", color: "#4f6478", marginBottom: "3px" }}>{label}</div>
            <div style={{ font: "500 15px 'Figtree',sans-serif", color: "#022449" }}>{value || <span style={{ color: "#b4c4d3" }}>—</span>}</div>
        </div>
    );
}

export default function AdminPhysioReviewPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [fetching, setFetching] = useState(true);
    const [fetchErr, setFetchErr] = useState<string | null>(null);
    const [note, setNote] = useState("");
    const [deciding, setDeciding] = useState(false);
    const [decisionErr, setDecisionErr] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/proxy/physios/admin/pending/${params.id}`)
            .then(r => r.ok ? r.json() : r.json().then((b: { message?: string }) => { throw new Error(b.message ?? "Failed to load profile"); }))
            .then(setProfile)
            .catch((e: Error) => setFetchErr(e.message))
            .finally(() => setFetching(false));
    }, [params.id]);

    async function decide(decision: "VERIFIED" | "REJECTED") {
        setDeciding(true); setDecisionErr(null);
        try {
            const res = await fetch("/api/proxy/physios/admin/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: params.id, decision, reason: note || undefined }),
            });
            if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.message ?? "Action failed"); }
            router.push("/admin/physios");
        } catch (err) { setDecisionErr((err as Error).message); }
        finally { setDeciding(false); }
    }

    if (fetching) {
        return (
            <>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                    <button type="button" className="btn btn2" style={{ minHeight: "34px", fontSize: "13px" }} onClick={() => router.push("/admin/physios")}>← Back</button>
                    <h1 style={{ font: "700 26px 'Figtree',sans-serif", margin: 0 }}>Review professional</h1>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
                    <div className="card" style={{ flex: "2 1 480px" }}>
                        {[240, 180, 120, 200, 160].map((w, i) => (
                            <div key={i} className="skel" style={{ height: "16px", width: `${w}px`, borderRadius: "6px", marginBottom: "16px" }} />
                        ))}
                    </div>
                </div>
            </>
        );
    }

    if (fetchErr || !profile) {
        return (
            <>
                <button type="button" className="btn btn2" style={{ minHeight: "34px", fontSize: "13px", marginBottom: "20px" }} onClick={() => router.push("/admin/physios")}>← Back</button>
                <div className="card" style={{ color: "#8f1d1d", font: "400 14px 'Figtree',sans-serif" }}>
                    {fetchErr ?? "Application not found or already reviewed."}
                </div>
            </>
        );
    }

    const idTypeLabel = profile.idType ? (ID_TYPE_LABELS[profile.idType as IdType] ?? profile.idType) : "Government ID";

    return (
        <>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <button type="button" className="btn btn2" style={{ minHeight: "34px", fontSize: "13px" }} onClick={() => router.push("/admin/physios")}>← Back</button>
                <h1 style={{ font: "700 26px 'Figtree',sans-serif", margin: 0 }}>Review professional</h1>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>

                {/* ── Left: full profile details ── */}
                <div className="card" style={{ flex: "2 1 480px" }}>
                    {/* Profile header */}
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        {profile.photoUrl ? (
                            <img src={profile.photoUrl} alt="Profile" style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", border: "2px solid #d9e3ec", flexShrink: 0 }} />
                        ) : (
                            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#d9e3ec", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", font: "700 24px 'Figtree',sans-serif", color: "#4f6478" }}>
                                {profile.user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <div style={{ font: "700 20px 'Figtree',sans-serif" }}>{profile.user.name}</div>
                            <div style={{ font: "500 14px 'Figtree',sans-serif", color: "#4f6478", marginTop: "2px" }}>
                                {DISCIPLINE_LABELS[profile.discipline as keyof typeof DISCIPLINE_LABELS] ?? profile.discipline}
                            </div>
                            <div style={{ font: "400 13px 'Figtree',sans-serif", color: "#4f6478" }}>{profile.user.email}</div>
                        </div>
                        <span className="chip warn" style={{ marginLeft: "auto", flexShrink: 0 }}>Pending</span>
                    </div>

                    <Section title="Credentials">
                        <Field label="Licence / registration number" value={profile.licenceNo} />
                        {profile.licensingBody && <Field label="Licensing body" value={profile.licensingBody} />}
                        <div style={{ marginBottom: "14px" }}>
                            <div style={{ font: "500 12px 'Figtree',sans-serif", color: "#4f6478", marginBottom: "6px" }}>Licence document</div>
                            <DocLink url={profile.licenceDocUrl} label="licence document" />
                        </div>
                        <div style={{ marginBottom: "14px" }}>
                            <div style={{ font: "500 12px 'Figtree',sans-serif", color: "#4f6478", marginBottom: "6px" }}>University / training certificate</div>
                            <DocLink url={profile.certificateUrl} label="certificate" />
                        </div>
                    </Section>

                    <Section title={idTypeLabel}>
                        <Field label={`${idTypeLabel} number`} value={profile.ninNumber} />
                        <div style={{ marginBottom: "14px" }}>
                            <div style={{ font: "500 12px 'Figtree',sans-serif", color: "#4f6478", marginBottom: "6px" }}>{idTypeLabel} document</div>
                            <DocLink url={profile.ninDocUrl} label="ID document" />
                        </div>
                    </Section>

                    <Section title="Profile">
                        <Field label="Service area" value={profile.serviceArea} />
                        <Field label="Specialties" value={profile.specialties.join(", ")} />
                        <div style={{ marginBottom: "12px" }}>
                            <div style={{ font: "500 12px 'Figtree',sans-serif", color: "#4f6478", marginBottom: "3px" }}>Bio</div>
                            <div style={{ font: "400 14px/1.6 'Figtree',sans-serif", color: "#022449" }}>{profile.bio || <span style={{ color: "#b4c4d3" }}>—</span>}</div>
                        </div>
                        <Field label="Submitted" value={new Date(profile.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })} />
                    </Section>
                </div>

                {/* ── Right: decision panel ── */}
                <div className="card" style={{ flex: "1 1 280px" }}>
                    <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>Decision</h2>
                    <p className="muted" style={{ font: "400 13px/1.5 'Figtree',sans-serif", marginTop: "8px" }}>
                        Confirm the licence number with the Medical Rehabilitation Therapists Board of Nigeria before approving. This action is recorded in the audit log.
                    </p>
                    <div style={{ marginTop: "18px" }}>
                        <label style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>
                            Note <span style={{ font: "400 13px 'Figtree',sans-serif", color: "#4f6478" }}>(sent to professional if rejected)</span>
                        </label>
                        <textarea
                            className="in"
                            placeholder="Optional reason or feedback"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            style={{ minHeight: "90px", padding: "10px 12px", resize: "vertical" }}
                        />
                    </div>
                    {decisionErr && (
                        <div style={{ color: "#8f1d1d", font: "400 13px 'Figtree',sans-serif", marginTop: "10px" }}>{decisionErr}</div>
                    )}
                    <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
                        <button type="button" className="btn" style={{ width: "100%" }} disabled={deciding} onClick={() => decide("VERIFIED")}>
                            {deciding ? "Processing…" : "Approve & verify"}
                        </button>
                        <button type="button" className="btn btn3" style={{ width: "100%" }} disabled={deciding} onClick={() => decide("REJECTED")}>
                            {deciding ? "Processing…" : "Reject application"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
