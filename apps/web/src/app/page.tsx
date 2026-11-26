import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@physio/shared";
import WaitlistForm from "@/components/waitlist-form";
import LandingNav from "@/components/landing-nav";

const OG_TITLE = "Rehab360 — Rehabilitation care, online, in Nigeria";
const OG_DESC =
    "Talk to a licensed physiotherapist, occupational therapist, speech therapist, prosthetist or orthotist by video. Pilot launching 1 December 2026.";

export const metadata: Metadata = {
    title: OG_TITLE,
    description: OG_DESC,
    openGraph: {
        title: OG_TITLE,
        description: OG_DESC,
        url: "https://rehab360.com.ng",
        siteName: BRAND.name,
        type: "website",
        images: [
            {
                url: "https://rehab360.com.ng/brand/og-image.png", // 1200×630 — ensure this file exists in /public/brand/
                width: 1200,
                height: 630,
                alt: OG_TITLE,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: OG_TITLE,
        description: OG_DESC,
        images: ["https://rehab360.com.ng/brand/og-image.png"],
    },
};

const DISCIPLINES = [
    { key: "PHYSIO",      label: "Physiotherapy",       desc: "Pain, injury, movement and recovery after surgery." },
    { key: "OT",          label: "Occupational therapy", desc: "Daily tasks, work, play and living independently." },
    { key: "SPEECH",      label: "Speech therapy",       desc: "Speaking, understanding, voice and swallowing." },
    { key: "PROSTHETIST", label: "Prosthetics",          desc: "Artificial limbs, fitting and follow-up." },
    { key: "ORTHOTIST",   label: "Orthotics",            desc: "Braces, supports and inserts." },
] as const;

const FOUNDING_BENEFITS = [
    { title: "Half-price commission", desc: "5% platform commission during the pilot (standard 10%). Rates locked for the life of the pilot." },
    { title: "Founding Specialist badge", desc: "Permanently displayed on your public profile — visible to every patient who finds you on Rehab360." },
    { title: "Early access to features", desc: "Shape the platform. Your feedback directly influences what we build next." },
    { title: "Dedicated onboarding support", desc: "Personal setup call, orientation walkthrough and direct WhatsApp support line." },
];

const NAV = "#022449";
const GREEN = "#1b7d0e";
const MUTED = "#4f6478";

export default function LandingPage() {
    return (
        <div style={{ width: "100%", fontFamily: "'Figtree',system-ui,sans-serif", color: NAV, background: "#f4f8fb", margin: 0 }}>

            {/* 5 px brand strip */}
            <div className="brand-strip" />

            <LandingNav />

            <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "0 24px" }}>

                {/* ── Hero ─────────────────────────────────────────────── */}
                <section style={{ display: "flex", flexWrap: "wrap" as const, gap: "48px", alignItems: "center", padding: "56px 0 72px" }}>
                    <div style={{ flex: "1 1 460px" }}>
                        <span className="chip ok" style={{ background: "#e3f4e8", color: "#1d5c34" }}>
                            ● Pilot launching 1 December 2026
                        </span>
                        <h1 style={{ font: "700 52px/1.08 'Figtree',sans-serif", marginTop: "18px", letterSpacing: "-0.02em" }}>
                            Rehabilitation care,{" "}
                            <span style={{ color: GREEN }}>online, from people you can trust.</span>
                        </h1>
                        <p className="muted" style={{ font: "400 19px/1.55 'Figtree',sans-serif", marginTop: "18px", maxWidth: "520px" }}>
                            Talk to a licensed physiotherapist, occupational therapist, speech therapist, prosthetist or
                            orthotist by video — then follow your personalised plan at home.
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "12px", marginTop: "28px" }}>
                            <Link className="btn" href="/auth/signup">Book a session</Link>
                            <a className="btn btn2" href="#specialists">Join as a specialist</a>
                        </div>
                        <p className="muted" style={{ font: "400 14px 'Figtree',sans-serif", marginTop: "16px" }}>
                            Already a member? <Link href="/auth/login" style={{ color: "#076889" }}>Log in</Link>
                        </p>
                    </div>
                    <div style={{ flex: "1 1 380px" }}>
                        <div className="card" style={{ padding: "28px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#cfe3ee" }} />
                                <div>
                                    <div style={{ font: "700 16px 'Figtree',sans-serif" }}>Adewale O. — Physiotherapist</div>
                                    <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif" }}>
                                        Licence verified · Founding Specialist
                                    </div>
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
                                <span className="chip">Video session · Next available today</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* ── How it works ─────────────────────────────────────────── */}
            <section id="how" style={{ background: "#fff", borderTop: "1px solid #d9e3ec", borderBottom: "1px solid #d9e3ec" }}>
                <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "64px 24px" }}>
                    <h2 style={{ font: "700 34px 'Figtree',sans-serif" }}>How it works for patients</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "24px", marginTop: "32px" }}>
                        {[
                            { n: "1", title: "Tell us what is wrong", desc: "A short questionnaire checks for red flags and routes you to the right kind of specialist." },
                            { n: "2", title: "Book your specialist",   desc: "Choose from verified, licensed professionals. See their profile before you pay." },
                            { n: "3", title: "Session by video",       desc: "Consult from home — your specialist assesses you, answers questions and designs a plan." },
                            { n: "4", title: "Follow your plan",       desc: "Exercises, goals and reminders on your phone, with direct messaging when you are unsure." },
                        ].map(s => (
                            <div key={s.n} className="card" style={{ background: "#f4f8fb" }}>
                                <div style={{ font: "700 15px 'Figtree',sans-serif", color: GREEN }}>{s.n}</div>
                                <h3 style={{ font: "700 20px 'Figtree',sans-serif", marginTop: "8px" }}>{s.title}</h3>
                                <p className="muted" style={{ font: "400 16px/1.5 'Figtree',sans-serif", marginTop: "8px" }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: "28px", textAlign: "center" }}>
                        <Link className="btn" href="/auth/signup" style={{ display: "inline-block" }}>Create a free account</Link>
                    </div>
                </div>
            </section>

            {/* ── Five disciplines ─────────────────────────────────────── */}
            <section id="services" style={{ maxWidth: "1160px", margin: "0 auto", padding: "64px 24px" }}>
                <h2 style={{ font: "700 34px 'Figtree',sans-serif" }}>Five rehabilitation disciplines, one platform</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "16px", marginTop: "28px" }}>
                    {DISCIPLINES.map((d, i) => (
                        <div key={d.key} className="card" style={{ padding: "20px" }}>
                            <div style={{ font: "700 13px 'Figtree',sans-serif", color: GREEN, marginBottom: "6px" }}>{i + 1}</div>
                            <h3 style={{ font: "700 17px 'Figtree',sans-serif" }}>{d.label}</h3>
                            <p className="muted" style={{ font: "400 14px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>{d.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Founding Specialist ───────────────────────────────────── */}
            <section id="specialists" style={{ background: NAV, color: "#fff" }}>
                <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "72px 24px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "56px", alignItems: "flex-start" }}>
                        <div style={{ flex: "1 1 420px" }}>
                            <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "99px", background: "rgba(27,125,14,0.25)", color: "#7ee87e", font: "600 13px 'Figtree',sans-serif", marginBottom: "16px" }}>
                                Founding Specialist Programme
                            </span>
                            <h2 style={{ font: "700 36px/1.1 'Figtree',sans-serif" }}>
                                Build your online practice from day one.
                            </h2>
                            <p style={{ font: "400 17px/1.55 'Figtree',sans-serif", marginTop: "14px", color: "#c9d9ec" }}>
                                We are accepting 50 licensed rehabilitation specialists for our December 2026 pilot.
                                Founding Specialists get permanent recognition and reduced fees — forever.
                            </p>
                            <div style={{ display: "grid", gap: "14px", marginTop: "32px" }}>
                                {FOUNDING_BENEFITS.map(b => (
                                    <div key={b.title} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                                        <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: GREEN, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", font: "700 14px 'Figtree',sans-serif", flexShrink: 0, marginTop: "2px" }}>✓</span>
                                        <div>
                                            <div style={{ font: "600 16px 'Figtree',sans-serif" }}>{b.title}</div>
                                            <div style={{ font: "400 14px/1.4 'Figtree',sans-serif", color: "#c9d9ec", marginTop: "3px" }}>{b.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p style={{ font: "400 13px 'Figtree',sans-serif", color: "#8aaccc", marginTop: "20px" }}>
                                You must hold a valid MDCN, CMLR or equivalent registration to apply.
                            </p>
                        </div>
                        <WaitlistForm />
                    </div>
                </div>
            </section>

            {/* ── FAQ ──────────────────────────────────────────────────── */}
            <section id="faq" style={{ maxWidth: "1160px", margin: "0 auto", padding: "64px 24px" }}>
                <h2 style={{ font: "700 34px 'Figtree',sans-serif" }}>Questions people ask</h2>
                <div style={{ display: "grid", gap: "12px", marginTop: "24px", maxWidth: "760px" }}>
                    {[
                        { q: "Is this for emergencies?",        a: "No. If you have severe pain, chest pain, trouble breathing, sudden weakness or loss of feeling, go to your nearest hospital or call 112." },
                        { q: "Are the specialists licensed?",   a: "Every professional is verified against their registration body before they appear on the platform. We also check the MRTB register for physiotherapists." },
                        { q: "Who can see my health records?",  a: "Only you and the specialist you book. Every access to a clinical record is logged under our audit system." },
                        { q: "What is the pilot?",              a: "The December 2026 – March 2027 pilot runs with up to 200 sessions at reduced fees. It is Rehab360's first live deployment in Nigeria." },
                        { q: "How do I pay?",                   a: "Sessions are paid by card or wallet through Paystack — a PCI-compliant Nigerian payment processor. We never store your card details." },
                    ].map(f => (
                        <div key={f.q} className="card" style={{ padding: "18px 20px" }}>
                            <h3 style={{ font: "600 17px 'Figtree',sans-serif" }}>{f.q}</h3>
                            <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif", marginTop: "6px" }}>{f.a}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <footer style={{ borderTop: "1px solid #d9e3ec", padding: "28px 24px" }}>
                <div style={{ maxWidth: "1160px", margin: "0 auto", display: "flex", flexWrap: "wrap" as const, justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                    <span style={{ font: "400 14px 'Figtree',sans-serif", color: MUTED }}>
                        © {new Date().getFullYear()} Rehab360. Not an emergency service.
                    </span>
                    <div style={{ display: "flex", gap: "20px", font: "400 14px 'Figtree',sans-serif" }}>
                        <Link href="/legal/privacy" style={{ color: MUTED }}>Privacy</Link>
                        <Link href="/legal/terms" style={{ color: MUTED }}>Terms</Link>
                        <Link href="/legal/pilot-agreement" style={{ color: MUTED }}>Pilot agreement</Link>
                        <Link href="/professionals" style={{ color: MUTED }}>Find a specialist</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
