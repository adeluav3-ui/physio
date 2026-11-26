// LAWYER REVIEW REQUIRED — This document must be reviewed and approved by a qualified
// Nigerian data-protection and healthcare lawyer before going live. All sections marked
// [REVIEW] need legal input. References to NDPA 2023 and NITDA regulations are
// directional only and must be verified against current law.

import Link from "next/link";

export const metadata = { title: "Privacy Notice — Rehab360" };

const SECTION: React.CSSProperties = { marginBottom: "28px" };
const H2: React.CSSProperties = { font: "700 18px 'Figtree',system-ui,sans-serif", color: "#022449", margin: "0 0 10px" };
const P: React.CSSProperties = { font: "400 15px/1.6 'Figtree',system-ui,sans-serif", color: "#334155", margin: "0 0 10px" };
const LI: React.CSSProperties = { font: "400 15px/1.6 'Figtree',system-ui,sans-serif", color: "#334155", marginBottom: "6px" };

export default function PrivacyPage() {
    return (
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px", fontFamily: "'Figtree',system-ui,sans-serif", color: "#022449" }}>
            <Link href="/" style={{ font: "500 14px 'Figtree',sans-serif", color: "#076889", textDecoration: "none" }}>← Back to Rehab360</Link>

            <h1 style={{ font: "700 32px 'Figtree',system-ui,sans-serif", margin: "24px 0 6px" }}>Privacy Notice</h1>
            <p style={{ font: "400 14px 'Figtree',sans-serif", color: "#64748b", margin: "0 0 32px" }}>
                Effective date: 1 December 2026 — Rehab360 (operated by [COMPANY NAME]) {/* [REVIEW] insert registered company name */}
            </p>

            <div style={SECTION}>
                <h2 style={H2}>1. Who we are</h2>
                {/* [REVIEW] Insert full legal name, RC number, registered address */}
                <p style={P}>
                    Rehab360 is an online rehabilitation platform that connects patients with licensed physiotherapists
                    and other rehabilitation specialists. References to &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
                    &ldquo;Rehab360&rdquo; in this notice mean [COMPANY NAME], a company registered in Nigeria under
                    RC [NUMBER].
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>2. What data we collect</h2>
                {/* [REVIEW] Confirm this list is exhaustive and matches actual DB schema */}
                <ul style={{ paddingLeft: "20px", margin: 0 }}>
                    {[
                        "Name, email address and password (hashed — we never store plaintext passwords)",
                        "Date of birth, sex and location (optional, used to match you with nearby specialists)",
                        "Health information you provide: symptoms, pain scores, body region, intake questionnaire answers",
                        "Session notes written by your specialist during and after a consultation",
                        "Video session metadata (duration, room ID) — we do not record video or audio",
                        "Payment transaction records (amount, reference) — card numbers are processed by Paystack and never stored by us",
                        "Device and browser information collected automatically to operate the service",
                        "Feedback and outcome scores you submit after a session",
                    ].map((item, i) => <li key={i} style={LI}>{item}</li>)}
                </ul>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>3. Why we process your data</h2>
                {/* [REVIEW] Confirm lawful basis for each processing activity under NDPA 2023 s.25 */}
                <ul style={{ paddingLeft: "20px", margin: 0 }}>
                    {[
                        "To provide telehealth consultations and facilitate the physiotherapist–patient relationship",
                        "To process payments for sessions (legitimate interest / contractual necessity)",
                        "To send appointment reminders and service messages (contractual necessity)",
                        "To improve care quality using anonymised, aggregated outcome data (legitimate interest)",
                        "To comply with Nigerian healthcare regulations and NDPA 2023",
                    ].map((item, i) => <li key={i} style={LI}>{item}</li>)}
                </ul>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>4. Who we share your data with</h2>
                {/* [REVIEW] Verify DPA agreements are in place with each sub-processor */}
                <p style={P}>
                    We share your data only as described below. We do not sell personal data.
                </p>
                <ul style={{ paddingLeft: "20px", margin: 0 }}>
                    {[
                        "Your specialist — clinical notes and intake answers are visible to the specialist you book. Notes are never shared with any other specialist without your explicit consent.",
                        "Paystack (payment processing) — transaction details are shared to process payment. Paystack is PCI-DSS compliant.",
                        "Daily.co (video infrastructure) — room tokens are issued to connect your session. Daily does not receive your health information.",
                        "Email delivery provider — your name and email to send transactional messages.",
                        "Regulatory bodies — where we are legally required to disclose (e.g. court order, NITDA directive).",
                    ].map((item, i) => <li key={i} style={LI}>{item}</li>)}
                </ul>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>5. Your rights under the NDPA 2023</h2>
                {/* [REVIEW] Confirm rights obligations and add complaint route to NITDA */}
                <p style={P}>Under the Nigeria Data Protection Act 2023 you have the right to:</p>
                <ul style={{ paddingLeft: "20px", margin: 0 }}>
                    {[
                        "Access a copy of personal data we hold about you",
                        "Correct inaccurate data",
                        "Request erasure (subject to our legal obligations to retain clinical records)",
                        "Object to processing based on legitimate interest",
                        "Withdraw consent at any time (this will not affect lawfulness of prior processing)",
                        "Lodge a complaint with the Nigeria Data Protection Commission (NDPC)",
                    ].map((item, i) => <li key={i} style={LI}>{item}</li>)}
                </ul>
                <p style={{ ...P, marginTop: "12px" }}>
                    To exercise any right, email <strong>privacy@rehab360.com.ng</strong>. {/* [REVIEW] confirm address */}
                    We will respond within 30 days.
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>6. Data retention</h2>
                {/* [REVIEW] Confirm retention periods comply with MDCN/CMLR clinical record rules */}
                <p style={P}>
                    Clinical session notes are retained for a minimum of 7 years as required by Nigerian
                    healthcare regulations. Payment records are retained for 7 years as required by FIRS.
                    Account data is deleted within 90 days of a deletion request where no legal hold applies.
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>7. Security</h2>
                {/* [REVIEW] Confirm encryption standards and incident response timeline */}
                <p style={P}>
                    Data is encrypted in transit (TLS 1.2+) and at rest. Access to clinical records is
                    logged under our audit system. We will notify affected users of a data breach within
                    72 hours of discovery as required by NDPA 2023.
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>8. Pilot programme</h2>
                {/* [REVIEW] Add specific pilot data use and retention terms */}
                <p style={P}>
                    During the December 2026 – March 2027 pilot, anonymised session outcome data (pain scores,
                    function scores, session ratings) may be used in aggregate to evaluate the programme. No
                    individual patient can be identified from these reports.
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>9. Changes to this notice</h2>
                <p style={P}>
                    We will notify you by email at least 14 days before material changes take effect.
                    Continued use of Rehab360 after the effective date constitutes acceptance.
                </p>
            </div>

            <p style={{ font: "400 13px 'Figtree',sans-serif", color: "#94a3b8", marginTop: "40px" }}>
                Questions? Email <strong>privacy@rehab360.com.ng</strong>
            </p>
        </div>
    );
}
