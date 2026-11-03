import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { requireSession } from "@/lib/session";
import { DISCIPLINE_LABELS } from "@physio/shared";

type Pending = {
    userId: string; discipline: string; licenceNo: string;
    licensingBody: string | null; licenceDocUrl: string | null;
    certificateUrl: string | null; idType: string | null;
    ninNumber: string | null; ninDocUrl: string | null;
    photoUrl: string | null; specialties: string[];
    bio: string; serviceArea: string; sessionTypes: string[];
    user: { name: string; email: string; createdAt: string };
};

export default async function AdminVerificationPage() {
    await requireSession(["ADMIN"]);
    let pending: Pending[] = [];
    try { pending = await apiFetch<Pending[]>("/physios/admin/pending"); } catch { /* empty */ }

    const first = pending[0] ?? null;

    return (
        <>
            <h1 style={{ font: "700 28px 'Figtree',sans-serif", margin: 0 }}>Verification queue</h1>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "14px", marginTop: "20px" }}>
                {[
                    { label: "Waiting for review", value: pending.length },
                    { label: "Open incidents", value: "—" },
                    { label: "Stalled referrals", value: "—" },
                    { label: "Disputed payments", value: "—" },
                ].map(s => (
                    <div key={s.label} className="card">
                        <div className="muted" style={{ font: "500 13px 'Figtree',sans-serif" }}>{s.label}</div>
                        <div style={{ font: "700 30px 'Figtree',sans-serif" }}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "20px", alignItems: "flex-start" }}>
                {/* Waiting list */}
                <div className="card" style={{ flex: "1 1 360px", paddingBottom: "6px" }}>
                    <h2 style={{ font: "700 17px 'Figtree',sans-serif", paddingBottom: "10px", margin: 0 }}>Waiting</h2>
                    {pending.length === 0 ? (
                        <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif", padding: "12px 0" }}>
                            No professionals waiting for verification.
                        </div>
                    ) : pending.map((p, i) => (
                        <Link key={p.userId} href={`/admin/physios/${p.userId}`}
                            style={{ display: "block", textDecoration: "none" }}
                            className="row">
                            <div style={{ flex: "1 1 160px" }}>
                                <div style={{ font: "600 15px 'Figtree',sans-serif", color: "#022449" }}>{p.user.name}</div>
                                <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif" }}>
                                    {DISCIPLINE_LABELS[p.discipline as keyof typeof DISCIPLINE_LABELS] ?? p.discipline}
                                </div>
                            </div>
                            <span className="chip warn">Pending</span>
                        </Link>
                    ))}
                </div>

                {/* Detail panel — first in list */}
                {first ? (
                    <div className="card" style={{ flex: "2 1 420px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "10px" }}>
                            <div>
                                <h2 style={{ font: "700 22px 'Figtree',sans-serif", margin: 0 }}>{first.user.name}</h2>
                                <div className="muted" style={{ font: "500 15px 'Figtree',sans-serif", marginTop: "2px" }}>
                                    {DISCIPLINE_LABELS[first.discipline as keyof typeof DISCIPLINE_LABELS] ?? first.discipline}
                                    {" · Submitted "}
                                    {new Date(first.user.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                                </div>
                            </div>
                            <span className="chip warn">Pending</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "14px", marginTop: "20px" }}>
                            {[
                                { label: "Licensing body", value: first.licensingBody ?? "—" },
                                { label: "Licence number", value: first.licenceNo },
                                { label: "Email", value: first.user.email },
                                { label: "City", value: first.serviceArea || "—" },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <div className="muted" style={{ font: "500 13px 'Figtree',sans-serif" }}>{label}</div>
                                    <div style={{ font: "600 15px 'Figtree',sans-serif", marginTop: "2px" }}>{value}</div>
                                </div>
                            ))}
                        </div>
                        {first.licenceDocUrl ? (
                            <div style={{ marginTop: "18px" }}>
                                <div className="muted" style={{ font: "500 13px 'Figtree',sans-serif", marginBottom: "8px" }}>Licence document</div>
                                {/\.(jpg|jpeg|png|webp)(\?|$)/i.test(first.licenceDocUrl) ? (
                                    <img src={first.licenceDocUrl} alt="Licence" style={{ maxWidth: "100%", maxHeight: "180px", borderRadius: "10px", objectFit: "cover", border: "1px solid #d9e3ec", display: "block" }} />
                                ) : (
                                    <a href={first.licenceDocUrl} target="_blank" rel="noopener noreferrer"
                                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#1b7d0e", font: "600 14px 'Figtree',sans-serif" }}>
                                        Open licence document
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                    </a>
                                )}
                            </div>
                        ) : (
                            <div style={{ marginTop: "18px", height: "80px", borderRadius: "12px", background: "#eef3f8", border: "1px dashed #b4c4d3", display: "flex", alignItems: "center", justifyContent: "center" }} className="muted">
                                <span style={{ font: "500 14px 'Figtree',sans-serif" }}>No licence document uploaded</span>
                            </div>
                        )}
                        <div style={{ marginTop: "18px" }}>
                            <Link href={`/admin/physios/${first.userId}`} className="btn">Review and decide</Link>
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ flex: "2 1 420px", color: "#4f6478", font: "400 15px 'Figtree',sans-serif" }}>
                        Select a professional from the list to review their details.
                    </div>
                )}
            </div>
        </>
    );
}
