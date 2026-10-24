import type { Metadata } from "next";
import { BRAND } from "@physio/shared";

export const metadata: Metadata = {
    title: BRAND.name,
    description: BRAND.tagline,
    openGraph: { title: BRAND.name, description: BRAND.tagline },
};

const DISCIPLINES = [
    { key: "PHYSIO",      label: "Physiotherapy",             desc: "Pain, injury, movement and recovery after surgery.",                   env: "NEXT_PUBLIC_WHATSAPP_PHYSIO" },
    { key: "OT",          label: "Occupational therapy",      desc: "Daily tasks, work, play and living independently.",                    env: "NEXT_PUBLIC_WHATSAPP_OT" },
    { key: "SPEECH",      label: "Speech therapy",            desc: "Speaking, understanding, voice and swallowing.",                       env: "NEXT_PUBLIC_WHATSAPP_SPEECH" },
    { key: "PROSTHETIST", label: "Prosthetics",               desc: "Artificial limbs, fitting and follow-up.",                            env: "NEXT_PUBLIC_WHATSAPP_PROSTHETIST" },
    { key: "ORTHOTIST",   label: "Orthotics",                 desc: "Braces, supports and inserts.",                                       env: "NEXT_PUBLIC_WHATSAPP_ORTHOTIST" },
] as const;

export default function LandingPage() {
    const patientLink = process.env.NEXT_PUBLIC_WHATSAPP_PATIENTS ?? "#join";

    return (
        <div style={{ width: "100%", fontFamily: "'Figtree',system-ui,sans-serif", color: "#12302c", background: "#f6f8f7", margin: 0 }}>

            {/* ── Header ──────────────────────────────────────────────── */}
            <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "0 24px" }}>
                <header style={{ display: "flex", flexWrap: "wrap" as const, gap: "16px", alignItems: "center", justifyContent: "space-between", padding: "20px 0" }}>
                    <div style={{ font: "700 22px 'Figtree',sans-serif", color: "#1b766e" }}>Rehab360</div>
                    <nav style={{ display: "flex", flexWrap: "wrap" as const, gap: "24px", alignItems: "center", font: "500 15px 'Figtree',sans-serif" }}>
                        <a href="#how" style={{ color: "#12302c", textDecoration: "none" }}>How it works</a>
                        <a href="#pros" style={{ color: "#12302c", textDecoration: "none" }}>For professionals</a>
                        <a href="#faq" style={{ color: "#12302c", textDecoration: "none" }}>FAQ</a>
                        <a className="btn" href="#join" style={{ minHeight: "44px" }}>Join the waitlist</a>
                    </nav>
                </header>

                {/* ── Hero ─────────────────────────────────────────────── */}
                <section style={{ display: "flex", flexWrap: "wrap" as const, gap: "48px", alignItems: "center", padding: "56px 0 72px" }}>
                    <div style={{ flex: "1 1 460px" }}>
                        <span className="chip">Opening soon in Nigeria</span>
                        <h1 style={{ font: "700 52px/1.08 'Figtree',sans-serif", marginTop: "18px", letterSpacing: "-0.02em" }}>
                            Rehabilitation care that comes to you, from people you can trust.
                        </h1>
                        <p className="muted" style={{ font: "400 19px/1.55 'Figtree',sans-serif", marginTop: "18px", maxWidth: "520px" }}>
                            Talk to a licensed physiotherapist, occupational therapist, speech therapist, prosthetist or orthotist by video, then follow your plan at home with them beside you.
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "12px", marginTop: "28px" }}>
                            <a className="btn" href={patientLink} target="_blank" rel="noopener noreferrer">I need care</a>
                            <a className="btn btn2" href="#pros">I provide care</a>
                        </div>
                        <p className="muted" style={{ font: "400 14px 'Figtree',sans-serif", marginTop: "16px" }}>Free to join the waitlist. No payment details needed.</p>
                    </div>
                    <div style={{ flex: "1 1 380px" }}>
                        <div className="card" style={{ padding: "28px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#cfe6e2" }}></div>
                                <div>
                                    <div style={{ font: "700 16px 'Figtree',sans-serif" }}>[Professional name]</div>
                                    <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif" }}>Physiotherapist · Licence verified</div>
                                </div>
                            </div>
                            <div style={{ marginTop: "20px", padding: "16px", borderRadius: "12px", background: "#f1f6f5" }}>
                                <div style={{ font: "600 13px 'Figtree',sans-serif", color: "#14544e" }}>Your plan for today</div>
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
            <section id="how" style={{ background: "#fff", borderTop: "1px solid #dbe5e2", borderBottom: "1px solid #dbe5e2" }}>
                <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "64px 24px" }}>
                    <h2 style={{ font: "700 34px 'Figtree',sans-serif" }}>How it works</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "24px", marginTop: "32px" }}>
                        <div className="card" style={{ background: "#f6f8f7" }}>
                            <div style={{ font: "700 15px 'Figtree',sans-serif", color: "#1b766e" }}>1</div>
                            <h3 style={{ font: "700 20px 'Figtree',sans-serif", marginTop: "8px" }}>Tell us what is wrong</h3>
                            <p className="muted" style={{ font: "400 16px/1.5 'Figtree',sans-serif", marginTop: "8px" }}>A few questions check for anything urgent and point you to the right kind of specialist.</p>
                        </div>
                        <div className="card" style={{ background: "#f6f8f7" }}>
                            <div style={{ font: "700 15px 'Figtree',sans-serif", color: "#1b766e" }}>2</div>
                            <h3 style={{ font: "700 20px 'Figtree',sans-serif", marginTop: "8px" }}>Meet your specialist</h3>
                            <p className="muted" style={{ font: "400 16px/1.5 'Figtree',sans-serif", marginTop: "8px" }}>Book a video session or a home visit with a professional whose licence we have checked.</p>
                        </div>
                        <div className="card" style={{ background: "#f6f8f7" }}>
                            <div style={{ font: "700 15px 'Figtree',sans-serif", color: "#1b766e" }}>3</div>
                            <h3 style={{ font: "700 20px 'Figtree',sans-serif", marginTop: "8px" }}>Follow your plan at home</h3>
                            <p className="muted" style={{ font: "400 16px/1.5 'Figtree',sans-serif", marginTop: "8px" }}>Exercises, goals and reminders on your phone, with messages to your specialist when you are unsure.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Five disciplines ─────────────────────────────────────── */}
            <section id="pros" style={{ maxWidth: "1160px", margin: "0 auto", padding: "64px 24px" }}>
                <h2 style={{ font: "700 34px 'Figtree',sans-serif" }}>Five kinds of rehabilitation care, one place</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "16px", marginTop: "28px" }}>
                    {DISCIPLINES.map((d) => (
                        <div key={d.key} className="card" style={{ padding: "20px" }}>
                            <h3 style={{ font: "700 17px 'Figtree',sans-serif" }}>{d.label}</h3>
                            <p className="muted" style={{ font: "400 14px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>{d.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Join / waitlist ───────────────────────────────────────── */}
            <section id="join" style={{ background: "#14544e", color: "#fff" }}>
                <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "64px 24px", display: "flex", flexWrap: "wrap" as const, gap: "48px" }}>
                    <div style={{ flex: "1 1 360px" }}>
                        <h2 style={{ font: "700 34px/1.15 'Figtree',sans-serif" }}>Be among the first.</h2>
                        <p style={{ font: "400 17px/1.55 'Figtree',sans-serif", marginTop: "12px", color: "#d6ebe8" }}>
                            Tell us who you are and we will invite you when your city opens. Professionals can also ask to join the first testing group.
                        </p>
                    </div>
                    <div className="card" style={{ flex: "1 1 420px", color: "#12302c" }}>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                            <div style={{ flex: 1, padding: "12px", textAlign: "center", borderRadius: "10px", background: "#1b766e", color: "#fff", font: "600 15px 'Figtree',sans-serif" }}>I need care</div>
                            <div style={{ flex: 1, padding: "12px", textAlign: "center", borderRadius: "10px", background: "#f1f6f5", font: "600 15px 'Figtree',sans-serif" }}>I provide care</div>
                        </div>
                        <div style={{ display: "grid", gap: "14px" }}>
                            <div><label className="flabel" htmlFor="w-name">Full name</label><input className="in" id="w-name" placeholder="Your name" /></div>
                            <div><label className="flabel" htmlFor="w-email">Email</label><input className="in" id="w-email" type="email" placeholder="you@example.com" /></div>
                            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "12px" }}>
                                <div style={{ flex: "1 1 180px" }}><label className="flabel" htmlFor="w-need">What do you need help with?</label><input className="in" id="w-need" placeholder="Pick one, or not sure" /></div>
                                <div style={{ flex: "1 1 140px" }}><label className="flabel" htmlFor="w-city">City</label><input className="in" id="w-city" placeholder="City" /></div>
                            </div>
                            <a className="btn" href={patientLink} target="_blank" rel="noopener noreferrer" style={{ width: "100%" }}>Join the waitlist</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FAQ ──────────────────────────────────────────────────── */}
            <section id="faq" style={{ maxWidth: "1160px", margin: "0 auto", padding: "64px 24px" }}>
                <h2 style={{ font: "700 34px 'Figtree',sans-serif" }}>Questions people ask</h2>
                <div style={{ display: "grid", gap: "12px", marginTop: "24px", maxWidth: "760px" }}>
                    <div className="card" style={{ padding: "18px 20px" }}>
                        <h3 style={{ font: "600 17px 'Figtree',sans-serif" }}>Is this for emergencies?</h3>
                        <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>No. If you have severe pain, chest pain, trouble breathing, sudden weakness or loss of feeling, go to the nearest hospital.</p>
                    </div>
                    <div className="card" style={{ padding: "18px 20px" }}>
                        <h3 style={{ font: "600 17px 'Figtree',sans-serif" }}>Are the professionals licensed?</h3>
                        <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>Every professional is checked against their licensing body before they appear in search.</p>
                    </div>
                    <div className="card" style={{ padding: "18px 20px" }}>
                        <h3 style={{ font: "600 17px 'Figtree',sans-serif" }}>Who can see my records?</h3>
                        <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>Only you and the professionals you choose. Every access to a record is logged.</p>
                    </div>
                </div>
            </section>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <footer style={{ borderTop: "1px solid #dbe5e2", padding: "28px 24px", textAlign: "center", font: "400 14px 'Figtree',sans-serif", color: "#4f6663" }}>
                Rehab360 · Privacy · Terms · Safety information
            </footer>
        </div>
    );
}
