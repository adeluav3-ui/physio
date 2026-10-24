"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const WHO_OPTIONS = ["Myself", "My child", "A parent or relative"] as const;

const WHAT_OPTIONS = [
    { label: "Pain or injury",                          next: "/app/intake/complaint" },
    { label: "Recovering after surgery or a stroke",    next: "/app/intake/complaint" },
    { label: "Daily tasks are getting hard",            next: "/app/intake/complaint" },
    { label: "Speech, voice or swallowing",             next: "/app/intake/complaint" },
    { label: "Artificial limb, brace or support",       next: "/professionals" },
    { label: "I am not sure",                           next: "/professionals" },
] as const;

type Step = 1 | 2 | "emergency";

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [who, setWho] = useState<string | null>(null);
    const [what, setWhat] = useState<string | null>(null);

    function handleWhoSelect(opt: string) {
        setWho(opt);
    }

    function handleWhatSelect(opt: typeof WHAT_OPTIONS[number]) {
        setWhat(opt.label);
        /* Urgent items route to /app/intake; others to /professionals.
           The full triage (red flag check) happens inside /app/intake.
           We don't show the emergency screen here — it appears after triage. */
        router.push(opt.next);
    }

    const progStep1 = "25%";
    const progStep2 = "50%";

    if (step === "emergency") {
        return (
            <div style={{ maxWidth: "430px", margin: "0 auto", minHeight: "100dvh", background: "#f6f8f7", fontFamily: "'Figtree',system-ui,sans-serif", padding: "28px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ padding: "20px", borderRadius: "16px", background: "#fde8e8", border: "1.5px solid #e3a3a3" }}>
                    <div style={{ font: "700 13px 'Figtree',sans-serif", color: "#8f1d1d" }}>PLEASE ACT NOW</div>
                    <h1 style={{ font: "700 26px/1.2 'Figtree',sans-serif", marginTop: "8px", color: "#5c1010" }}>What you described needs urgent medical care.</h1>
                    <p style={{ font: "400 16px/1.5 'Figtree',sans-serif", marginTop: "10px", color: "#5c1010" }}>Go to the nearest hospital or emergency unit now. Do not wait for an online session.</p>
                </div>
                <p className="muted" style={{ font: "400 15px/1.5 'Figtree',sans-serif" }}>Booking is paused for safety. After you have been seen by a doctor, you are welcome to come back and book rehabilitation care.</p>
                <div style={{ marginTop: "auto", display: "grid", gap: "10px" }}>
                    <a className="btn" href="tel:112" style={{ display: "flex" }}>Find emergency numbers</a>
                    <button type="button" className="opt" style={{ textAlign: "center" }} onClick={() => setStep(1)}>Back to start</button>
                </div>
            </div>
        );
    }

    if (step === 2) {
        return (
            <div style={{ maxWidth: "430px", margin: "0 auto", minHeight: "100dvh", background: "#f6f8f7", fontFamily: "'Figtree',system-ui,sans-serif", padding: "28px 24px", display: "flex", flexDirection: "column" }}>
                {/* Progress bar */}
                <div style={{ height: "6px", borderRadius: "99px", background: "#dbe5e2" }}>
                    <div style={{ width: progStep2, height: "6px", borderRadius: "99px", background: "#1b766e" }}></div>
                </div>
                <h1 style={{ font: "700 28px/1.2 'Figtree',sans-serif", marginTop: "32px" }}>What do you need help with?</h1>
                <p className="muted" style={{ font: "400 16px/1.5 'Figtree',sans-serif", marginTop: "8px" }}>Pick the closest. We will match you with the right kind of specialist.</p>
                <div style={{ display: "grid", gap: "10px", marginTop: "24px" }}>
                    {WHAT_OPTIONS.map(opt => (
                        <button
                            key={opt.label}
                            type="button"
                            className={`opt${what === opt.label ? " opton" : ""}`}
                            onClick={() => handleWhatSelect(opt)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <div style={{ marginTop: "auto" }}>
                    <button type="button" className="btn" style={{ display: "flex", width: "100%", minHeight: "52px", borderRadius: "12px", marginTop: "24px" }} onClick={() => what && router.push(WHAT_OPTIONS.find(o => o.label === what)?.next ?? "/professionals")}>
                        Continue
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "430px", margin: "0 auto", minHeight: "100dvh", background: "#f6f8f7", fontFamily: "'Figtree',system-ui,sans-serif", padding: "28px 24px", display: "flex", flexDirection: "column" }}>
            {/* Progress bar */}
            <div style={{ height: "6px", borderRadius: "99px", background: "#dbe5e2" }}>
                <div style={{ width: progStep1, height: "6px", borderRadius: "99px", background: "#1b766e" }}></div>
            </div>
            <h1 style={{ font: "700 28px/1.2 'Figtree',sans-serif", marginTop: "32px" }}>Who needs care?</h1>
            <p className="muted" style={{ font: "400 16px/1.5 'Figtree',sans-serif", marginTop: "8px" }}>You can book for yourself or for someone you look after.</p>
            <div style={{ display: "grid", gap: "12px", marginTop: "28px" }}>
                {WHO_OPTIONS.map(opt => (
                    <button
                        key={opt}
                        type="button"
                        className={`opt${who === opt ? " opton" : ""}`}
                        onClick={() => handleWhoSelect(opt)}
                    >
                        {opt}
                    </button>
                ))}
            </div>
            <div style={{ marginTop: "auto" }}>
                <button
                    type="button"
                    className="btn"
                    style={{ display: "flex", width: "100%", minHeight: "52px", borderRadius: "12px", marginTop: "24px" }}
                    onClick={() => { if (who) setStep(2); }}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
