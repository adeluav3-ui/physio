import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { apiFetch, ApiError } from "@/lib/api";
import type { PublicProfessional } from "../page";

const DISCIPLINE_LABELS: Record<string, string> = {
    PHYSIOTHERAPY: "Physiotherapy",
    OCCUPATIONAL_THERAPY: "Occupational therapy",
    SPEECH_THERAPY: "Speech therapy",
    PROSTHETICS: "Prosthetics",
    ORTHOTICS: "Orthotics",
};

type Props = { params: Promise<{ id: string }> };

async function fetchProfile(id: string): Promise<PublicProfessional | null> {
    try {
        return await apiFetch<PublicProfessional>(`/physios/${id}`);
    } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const p = await fetchProfile(id);
    if (!p) return { title: "Professional not found" };
    const discipline = DISCIPLINE_LABELS[p.discipline] ?? p.discipline;
    return {
        title: p.user.name,
        description: `${p.user.name} — ${discipline} on Rehab360. ${p.bio ?? ""}`.trim(),
    };
}

export default async function PublicProfilePage({ params }: Props) {
    const { id } = await params;
    const p = await fetchProfile(id);
    if (!p) notFound();

    const discipline = DISCIPLINE_LABELS[p.discipline] ?? p.discipline;
    const price = p.rateKobo ? `₦${(p.rateKobo / 100).toLocaleString()}` : "₦[price]";

    return (
        <div style={{ width: "100%", fontFamily: "'Figtree',system-ui,sans-serif", color: "#12302c", background: "#f6f8f7" }}>
            <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "0 24px" }}>
                <header style={{ display: "flex", flexWrap: "wrap" as const, gap: "16px", alignItems: "center", justifyContent: "space-between", padding: "20px 0" }}>
                    <Link href="/" style={{ font: "700 22px 'Figtree',sans-serif", color: "#1b766e", textDecoration: "none" }}>Rehab360</Link>
                    <Link href="/auth/login" className="btn btn2">Log in</Link>
                </header>

                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "24px", alignItems: "flex-start", paddingBottom: "64px" }}>
                    {/* Left column */}
                    <div style={{ flex: "999 1 560px", minWidth: 0, display: "grid", gap: "20px" }}>
                        {/* Hero card */}
                        <div className="card" style={{ display: "flex", flexWrap: "wrap" as const, gap: "24px" }}>
                            <div style={{ width: "120px", height: "120px", borderRadius: "50%", background: "#cfe6e2", flexShrink: 0 }}></div>
                            <div style={{ flex: "1 1 300px" }}>
                                <h1 style={{ font: "700 30px 'Figtree',sans-serif", margin: 0 }}>{p.user.name}</h1>
                                <div className="muted" style={{ font: "500 17px 'Figtree',sans-serif", marginTop: "4px" }}>{discipline}</div>
                                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", marginTop: "12px" }}>
                                    {p.verified && <span className="chip-sm ok">Licence verified</span>}
                                    {(p.languages ?? []).map(l => <span key={l} className="chip-sm">{l}</span>)}
                                    {(p.sessionTypes ?? []).map(s => <span key={s} className="chip-sm">{s}</span>)}
                                </div>
                                {p.bio && (
                                    <p className="muted" style={{ font: "400 16px/1.55 'Figtree',sans-serif", marginTop: "14px" }}>{p.bio}</p>
                                )}
                            </div>
                        </div>

                        {/* Specialties */}
                        {p.specialties?.length > 0 && (
                            <div className="card">
                                <h2 style={{ font: "700 20px 'Figtree',sans-serif", margin: 0 }}>What I treat</h2>
                                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", marginTop: "12px" }}>
                                    {p.specialties.map(s => <span key={s} className="chip-sm">{s}</span>)}
                                </div>
                            </div>
                        )}

                        {/* How a session works */}
                        <div className="card">
                            <h2 style={{ font: "700 20px 'Figtree',sans-serif", margin: 0 }}>How a session works</h2>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "16px", marginTop: "14px" }}>
                                <div>
                                    <div style={{ font: "700 14px 'Figtree',sans-serif", color: "#1b766e" }}>1. Book</div>
                                    <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "4px" }}>Choose a time and answer a few safety questions.</p>
                                </div>
                                <div>
                                    <div style={{ font: "700 14px 'Figtree',sans-serif", color: "#1b766e" }}>2. Meet</div>
                                    <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "4px" }}>Join by video or receive a home visit.</p>
                                </div>
                                <div>
                                    <div style={{ font: "700 14px 'Figtree',sans-serif", color: "#1b766e" }}>3. Follow your plan</div>
                                    <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "4px" }}>Get exercises and goals on your phone.</p>
                                </div>
                            </div>
                        </div>

                        {/* Licence */}
                        <div className="card">
                            <h2 style={{ font: "700 20px 'Figtree',sans-serif", margin: 0 }}>Licence and registration</h2>
                            <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "8px" }}>
                                {p.verified
                                    ? "Licence checked by our team. We show the badge only after a manual check."
                                    : "Licensing body: [Body name]. Checked by our team on [date]. We show the badge only after a manual check."}
                            </p>
                        </div>
                    </div>

                    {/* Booking sidebar */}
                    <aside style={{ flex: "1 1 320px", minWidth: 0 }}>
                        <div className="card" style={{ display: "grid", gap: "14px" }}>
                            <div style={{ font: "700 24px 'Figtree',sans-serif" }}>
                                {price} <span className="muted" style={{ font: "400 15px 'Figtree',sans-serif" }}>per session</span>
                            </div>
                            <div>
                                <div style={{ font: "600 14px 'Figtree',sans-serif", marginBottom: "8px" }}>Session type</div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    {(p.sessionTypes?.length ? p.sessionTypes : ["Video"]).map((s, i) => (
                                        <span key={s} className={`slot${i === 0 ? " on" : ""}`}>{s}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div style={{ font: "600 14px 'Figtree',sans-serif", marginBottom: "8px" }}>Next open times</div>
                                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px" }}>
                                    <span className="slot">Tue 10:00</span>
                                    <span className="slot">Tue 11:00</span>
                                    <span className="slot">Wed 9:00</span>
                                    <span className="slot">Wed 3:00 pm</span>
                                </div>
                            </div>
                            <Link href={`/auth/signup?next=/app/book/${p.userId}`} className="btn" style={{ textAlign: "center" }}>Book a session</Link>
                            <p className="muted" style={{ font: "400 13px/1.5 'Figtree',sans-serif" }}>Not an emergency service. If symptoms are severe or sudden, go to the nearest hospital.</p>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
