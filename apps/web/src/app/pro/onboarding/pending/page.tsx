"use client";

import { useEffect, useState } from "react";

export default function PhysioPendingPage() {
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        fetch("/api/proxy/auth/me")
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then(user => {
                if (user.role !== "PHYSIO" && user.role !== "PATIENT") throw new Error();
                setChecking(false);
            })
            .catch(() => { window.location.href = "/auth/login?next=/pro/onboarding/pending"; });
    }, []);

    if (checking) {
        return (
            <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree',system-ui,sans-serif", background: "#f6f8f7" }}>
                <div className="muted" style={{ font: "400 15px 'Figtree',sans-serif" }}>Loading…</div>
            </div>
        );
    }

    return (
        <div style={{ width: "100%", padding: "24px", fontFamily: "'Figtree',system-ui,sans-serif", color: "#12302c", background: "#f6f8f7", minHeight: "100dvh" }}>
            <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
                <div style={{ font: "700 22px 'Figtree',sans-serif", color: "#1b766e" }}>Rehab360</div>
                <div style={{ maxWidth: "520px", margin: "80px auto 0", textAlign: "center" }}>
                    <div className="card" style={{ padding: "48px 32px" }}>
                        <div style={{ font: "700 26px 'Figtree',sans-serif" }}>Application received</div>
                        <p className="muted" style={{ font: "400 16px/1.6 'Figtree',sans-serif", marginTop: "12px" }}>
                            {"We're reviewing your licence details. This usually takes 1–2 business days."}
                            <br />
                            {"You'll receive an email when your profile is live."}
                        </p>
                        <div className="chip warn" style={{ marginTop: "20px" }}>Verification in progress</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
