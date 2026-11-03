import type { Metadata } from "next";
import Image from "next/image";
import { BRAND } from "@physio/shared";
import WaitlistForm from "@/components/waitlist-form";
import LandingNav from "@/components/landing-nav";

export const metadata: Metadata = {
    title: BRAND.name,
    description: BRAND.tagline,
    openGraph: { title: BRAND.name, description: BRAND.tagline },
};

const DISCIPLINES = [
    { key: "PHYSIO",      label: "Physiotherapy",       desc: "Pain, injury, movement and recovery after surgery." },
    { key: "OT",          label: "Occupational therapy", desc: "Daily tasks, work, play and living independently." },
    { key: "SPEECH",      label: "Speech therapy",       desc: "Speaking, understanding, voice and swallowing." },
    { key: "PROSTHETIST", label: "Prosthetics",          desc: "Artificial limbs, fitting and follow-up." },
    { key: "ORTHOTIST",   label: "Orthotics",            desc: "Braces, supports and inserts." },
] as const;

export default function LandingPage() {
    const patientLink = process.env.NEXT_PUBLIC_WHATSAPP_PATIENTS ?? "#join";

    return (
        <div style={{ width: "100%", fontFamily: "'Figtree',system-ui,sans-serif", color: "#022449", background: "#f4f8fb", margin: 0 }}>

            {/* 5 px brand strip */}
            <div className="brand-strip" />

            <LandingNav />

            <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "0 24px" }}>
                {/* ── Hero ─────────────────────────────────────────────── */}
                <section style={{ display: "flex", flexWrap: "wrap" as const, gap: "48px", alignItems: "center", padding: "56px 0 72px" }}>
                    <div style={{ flex: "1 1 460px" }}>
                        <span className="chip">Opening soon in Nigeria</span>
                        <h1 style={{ font: "700 52px/1.08 'Figtree',sans-serif", marginTop: "18px", letterSpacing: "-0.02em" }}>
                            Rehabilitation care that comes to you,{" "}
                            <span style={{ color: "#1b7d0e" }}>from people you can trust.</span>
                        </h1>
                        <p className="muted" style={{ font: "400 19px/1.55 'Figtree',sans-serif", marginTop: "18px", maxWidth: "520px" }}>
                            Talk to a licensed physiotherapist, occupational therapist, speech therapist, prosthetist or orthotist by video, then follow your plan at home with them beside you.
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "12px", marginTop: "28px" }}>
                            <a className="btn" href={patientLink} target="_blank" rel="noopener noreferrer">I need care</a>
                            <a className="btn btn2" href="#join">I provide care</a>
                        </div>
                        <p className="muted" style={{ font: "400 14px 'Figtree',sans-serif", marginTop: "16px" }}>Free to join the waitlist. No payment details needed.</p>
                    </div>
                    <div style={{ flex: "1 1 380px" }}>
                        <div className="card" style={{ padding: "28px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#cfe3ee" }}></div>
                                <div>
                                    <div style={{ font: "700 16px 'Figtree',sans-serif" }}>[Professional name]</div>
                                    <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif" }}>Physiotherapist · Licence verified</div>
                                </div>
                            </div>
                            <div style={{ marginTop: "20px", padding: "16px", borderRadius: "12px", background: "#eef3f8" }}>
                                <div style={{ font: "600 13px 'Figtree',sans-serif", color: "#0f5a08" }}>Your plan for today</div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", font: "500 15px 'Figtree',sans-serif" }}>
                                    <span>Shoulder mobility</span><span className="muted">3 sets</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", font: "500 15px 'Figtree',sans-serif" }}>
                                    <span>Wall slides</span><span className="muted">10 reps</span>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                                <span className="chip">Video session Thu 4:00 pm</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* ── How it works ─────────────────────────────────────────── */}
            <section id="how" style={{ background: "#fff", borderTop: "1px solid #d9e3ec", borderBottom: "1px solid #d9e3ec" }}>
                <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "64px 24px" }}>
                    <h2 style={{ font: "700 34px 'Figtree',sans-serif" }}>How it works</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "24px", marginTop: "32px" }}>
                        {[
                            { n: "1", title: "Tell us what is wrong", desc: "A few questions check for anything urgent and point you to the right kind of specialist." },
                            { n: "2", title: "Meet your specialist",   desc: "Book a video session or a home visit with a professional whose licence we have checked." },
                            { n: "3", title: "Follow your plan at home", desc: "Exercises, goals and reminders on your phone, with messages to your specialist when you are unsure." },
                        ].map(s => (
                            <div key={s.n} className="card" style={{ background: "#f4f8fb" }}>
                                <div style={{ font: "700 15px 'Figtree',sans-serif", color: "#1b7d0e" }}>{s.n}</div>
                                <h3 style={{ font: "700 20px 'Figtree',sans-serif", marginTop: "8px" }}>{s.title}</h3>
                                <p className="muted" style={{ font: "400 16px/1.5 'Figtree',sans-serif", marginTop: "8px" }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Five disciplines ─────────────────────────────────────── */}
            <section id="pros" style={{ maxWidth: "1160px", margin: "0 auto", padding: "64px 24px" }}>
                <h2 style={{ font: "700 34px 'Figtree',sans-serif" }}>Five different rehabilitation care, all in one place</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "16px", marginTop: "28px" }}>
                    {DISCIPLINES.map((d, i) => (
                        <div key={d.key} className="card" style={{ padding: "20px" }}>
                            <div style={{ font: "700 13px 'Figtree',sans-serif", color: "#1b7d0e", marginBottom: "6px" }}>{i + 1}</div>
                            <h3 style={{ font: "700 17px 'Figtree',sans-serif" }}>{d.label}</h3>
                            <p className="muted" style={{ font: "400 14px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>{d.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Join / waitlist ───────────────────────────────────────── */}
            <section id="join" style={{ background: "#022449", color: "#fff" }}>
                <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "64px 24px", display: "flex", flexWrap: "wrap" as const, gap: "48px" }}>
                    <div style={{ flex: "1 1 360px" }}>
                        <h2 style={{ font: "700 34px/1.15 'Figtree',sans-serif" }}>Be among the first.</h2>
                        <p style={{ font: "400 17px/1.55 'Figtree',sans-serif", marginTop: "12px", color: "#c9d9ec" }}>
                            Tell us who you are and we will invite you when your city opens. Professionals can also ask to join the first testing group.
                        </p>
                    </div>
                    <WaitlistForm />
                </div>
            </section>

            {/* ── FAQ ──────────────────────────────────────────────────── */}
            <section id="faq" style={{ maxWidth: "1160px", margin: "0 auto", padding: "64px 24px" }}>
                <h2 style={{ font: "700 34px 'Figtree',sans-serif" }}>Questions people ask</h2>
                <div style={{ display: "grid", gap: "12px", marginTop: "24px", maxWidth: "760px" }}>
                    {[
                        { q: "Is this for emergencies?",        a: "No. If you have severe pain, chest pain, trouble breathing, sudden weakness or loss of feeling, go to the nearest hospital." },
                        { q: "Are the professionals licensed?", a: "Every professional is checked against their licensing body before they appear in search." },
                        { q: "Who can see my records?",         a: "Only you and the professionals you choose. Every access to a record is logged." },
                    ].map(f => (
                        <div key={f.q} className="card" style={{ padding: "18px 20px" }}>
                            <h3 style={{ font: "600 17px 'Figtree',sans-serif" }}>{f.q}</h3>
                            <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>{f.a}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <footer style={{ borderTop: "1px solid #d9e3ec", padding: "28px 24px", textAlign: "center", font: "400 14px 'Figtree',sans-serif", color: "#4f6478" }}>
                Rehab360 · Privacy · Terms · Safety information
            </footer>
        </div>
    );
}
