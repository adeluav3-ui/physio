// LAWYER REVIEW REQUIRED — This document must be reviewed and approved by a qualified
// Nigerian healthcare and commercial lawyer before going live. All sections marked
// [REVIEW] need legal input. References to Nigerian law are directional only and
// must be verified against current legislation.

import Link from "next/link";

export const metadata = { title: "Terms of Service — Rehab360" };

const SECTION: React.CSSProperties = { marginBottom: "28px" };
const H2: React.CSSProperties = { font: "700 18px 'Figtree',system-ui,sans-serif", color: "#022449", margin: "0 0 10px" };
const P: React.CSSProperties = { font: "400 15px/1.6 'Figtree',system-ui,sans-serif", color: "#334155", margin: "0 0 10px" };
const LI: React.CSSProperties = { font: "400 15px/1.6 'Figtree',system-ui,sans-serif", color: "#334155", marginBottom: "6px" };

export default function TermsPage() {
    return (
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px", fontFamily: "'Figtree',system-ui,sans-serif", color: "#022449" }}>
            <Link href="/" style={{ font: "500 14px 'Figtree',sans-serif", color: "#076889", textDecoration: "none" }}>← Back to Rehab360</Link>

            <h1 style={{ font: "700 32px 'Figtree',system-ui,sans-serif", margin: "24px 0 6px" }}>Terms of Service</h1>
            <p style={{ font: "400 14px 'Figtree',sans-serif", color: "#64748b", margin: "0 0 32px" }}>
                Effective date: 1 December 2026
            </p>

            <div style={SECTION}>
                <h2 style={H2}>1. The service</h2>
                {/* [REVIEW] Confirm Rehab360's legal status — is it a platform intermediary or a healthcare provider? */}
                <p style={P}>
                    Rehab360 is a technology platform that connects patients with independent, licensed
                    rehabilitation specialists. Rehab360 does not employ specialists and is not itself a
                    healthcare provider. Clinical decisions are made by the specialist you book, not by
                    Rehab360.
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>2. Eligibility</h2>
                {/* [REVIEW] Confirm age of majority for medical consent in Nigeria; add parental consent flow if needed */}
                <p style={P}>
                    You must be at least 18 years old to create an account. By registering you confirm
                    that you are 18 or older. If you are creating an account on behalf of a minor, [REVIEW:
                    parental consent mechanism not yet implemented — add before general launch].
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>3. Not an emergency service</h2>
                {/* [REVIEW] Confirm this disclaimer is sufficient; consider adding liability cap */}
                <p style={{ ...P, background: "#fef9c3", padding: "12px 16px", borderRadius: "10px", border: "1px solid #fde047" }}>
                    Rehab360 is not an emergency service. If you are experiencing a medical emergency,
                    call 112 or go to your nearest emergency room immediately. Do not use Rehab360
                    to seek urgent medical care.
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>4. Accounts</h2>
                <ul style={{ paddingLeft: "20px", margin: 0 }}>
                    {[
                        "You are responsible for keeping your login credentials secure.",
                        "You must provide accurate registration information.",
                        "You may not share your account with any other person.",
                        "We may suspend accounts we suspect are used fraudulently.",
                    ].map((item, i) => <li key={i} style={LI}>{item}</li>)}
                </ul>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>5. Payments and refunds</h2>
                {/* [REVIEW] Confirm refund policy complies with FCCPC consumer protection rules */}
                <ul style={{ paddingLeft: "20px", margin: 0 }}>
                    {[
                        "Session fees are displayed before you confirm a booking.",
                        "Payment is processed by Paystack. Rehab360 does not store card details.",
                        "Cancellation more than 24 hours before a session: full refund to wallet.",
                        "Cancellation within 24 hours: 50% refund. [REVIEW: confirm this policy]",
                        "If a specialist fails to attend, you receive a full refund.",
                        "Pilot pricing applies where the pilot programme is active (Dec 2026 – Mar 2027).",
                    ].map((item, i) => <li key={i} style={LI}>{item}</li>)}
                </ul>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>6. Clinical records</h2>
                {/* [REVIEW] Confirm ownership and access rights under Nigerian health law */}
                <p style={P}>
                    Session notes are written by your specialist and are accessible to you through your
                    account. Notes are owned by [REVIEW: confirm — patient or platform?] and retained for
                    a minimum of 7 years. We will not share your clinical records with any third party
                    without your explicit consent except where legally required.
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>7. Acceptable use</h2>
                <p style={P}>You agree not to:</p>
                <ul style={{ paddingLeft: "20px", margin: 0 }}>
                    {[
                        "Provide false information when registering or booking",
                        "Harass, abuse or threaten any specialist or other user",
                        "Attempt to circumvent the platform to book sessions directly with a specialist",
                        "Use the platform for any unlawful purpose",
                        "Attempt to scrape or reverse-engineer the platform",
                    ].map((item, i) => <li key={i} style={LI}>{item}</li>)}
                </ul>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>8. Limitation of liability</h2>
                {/* [REVIEW] Confirm cap is enforceable in Nigeria; align with insurance coverage */}
                <p style={P}>
                    To the maximum extent permitted by Nigerian law, Rehab360&apos;s total liability for
                    any claim arising from use of the platform is limited to the amount you paid for the
                    session that gave rise to the claim. We are not liable for indirect, consequential,
                    or special damages.
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>9. Governing law</h2>
                {/* [REVIEW] Confirm jurisdiction and dispute resolution mechanism */}
                <p style={P}>
                    These Terms are governed by the laws of the Federal Republic of Nigeria. Any dispute
                    shall be subject to the exclusive jurisdiction of the courts of [REVIEW: insert state].
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>10. Changes to these Terms</h2>
                <p style={P}>
                    We will give 14 days&apos; notice of material changes. Continued use after the effective
                    date constitutes acceptance.
                </p>
            </div>

            <p style={{ font: "400 13px 'Figtree',sans-serif", color: "#94a3b8", marginTop: "40px" }}>
                Questions? Email <strong>legal@rehab360.com.ng</strong> {/* [REVIEW] confirm address */}
            </p>
        </div>
    );
}
