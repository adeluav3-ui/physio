// LAWYER REVIEW REQUIRED — This specialist pilot agreement must be reviewed by a
// qualified Nigerian healthcare and commercial lawyer before the pilot launches.
// All sections marked [REVIEW] need legal input.
// Key questions for legal: (1) is this a service agreement or employment-adjacent?
// (2) are commission rates and fee structures sufficiently disclosed? (3) does this
// satisfy MDCN/CMLR requirements for telehealth practitioners?

import Link from "next/link";

export const metadata = { title: "Founding Specialist Pilot Agreement — Rehab360" };

const SECTION: React.CSSProperties = { marginBottom: "28px" };
const H2: React.CSSProperties = { font: "700 18px 'Figtree',system-ui,sans-serif", color: "#022449", margin: "0 0 10px" };
const P: React.CSSProperties = { font: "400 15px/1.6 'Figtree',system-ui,sans-serif", color: "#334155", margin: "0 0 10px" };
const LI: React.CSSProperties = { font: "400 15px/1.6 'Figtree',system-ui,sans-serif", color: "#334155", marginBottom: "6px" };

export default function PilotAgreementPage() {
    return (
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px", fontFamily: "'Figtree',system-ui,sans-serif", color: "#022449" }}>
            <Link href="/" style={{ font: "500 14px 'Figtree',sans-serif", color: "#076889", textDecoration: "none" }}>← Back to Rehab360</Link>

            <h1 style={{ font: "700 32px 'Figtree',system-ui,sans-serif", margin: "24px 0 6px" }}>Founding Specialist Pilot Agreement</h1>
            <p style={{ font: "400 14px 'Figtree',sans-serif", color: "#64748b", margin: "0 0 32px" }}>
                Effective: 1 December 2026 – 1 March 2027 (the &ldquo;Pilot Period&rdquo;)
            </p>

            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "16px 20px", marginBottom: "28px" }}>
                <p style={{ font: "600 15px 'Figtree',sans-serif", color: "#1e3a8a", margin: "0 0 6px" }}>
                    You are applying to join Rehab360 as a Founding Specialist.
                </p>
                <p style={{ font: "400 14px/1.5 'Figtree',sans-serif", color: "#1e40af", margin: 0 }}>
                    This agreement sets out the terms under which you will provide services on the
                    platform during the pilot period. Please read it carefully before accepting.
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>1. Nature of the relationship</h2>
                {/* [REVIEW] Confirm independent contractor status under Nigerian labour law */}
                <p style={P}>
                    You are an independent contractor, not an employee of Rehab360. You retain clinical
                    autonomy over all decisions you make for your patients. Rehab360 provides the technology
                    platform; it does not supervise or direct your clinical practice.
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>2. Eligibility requirements</h2>
                {/* [REVIEW] Confirm these match MDCN and CMLR minimum requirements for telehealth */}
                <ul style={{ paddingLeft: "20px", margin: 0 }}>
                    {[
                        "Current, valid registration with MDCN, CMLR, or the relevant council for your discipline",
                        "Professional indemnity insurance (minimum ₦5,000,000 coverage) [REVIEW: confirm minimum]",
                        "Completion of the Rehab360 platform orientation",
                        "Agreement to Rehab360's clinical quality standards [REVIEW: add link to standards doc]",
                    ].map((item, i) => <li key={i} style={LI}>{item}</li>)}
                </ul>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>3. Pilot fees and commission</h2>
                {/* [REVIEW] Confirm fee disclosure meets FCCPC and CBN requirements */}
                <p style={P}>
                    During the Pilot Period, reduced platform fees apply:
                </p>
                <ul style={{ paddingLeft: "20px", margin: 0 }}>
                    <li style={LI}><strong>Platform commission: 5%</strong> (standard rate: 10%)</li>
                    <li style={LI}><strong>Service fee: 2.5%</strong> capped at ₦500 per session (standard: 5%)</li>
                    <li style={LI}>Video add-on: ₦250 per session (standard: ₦500)</li>
                    <li style={LI}>Free video included for first 2 sessions with each patient [REVIEW: confirm]</li>
                </ul>
                <p style={{ ...P, marginTop: "12px" }}>
                    The fee breakdown is shown to you before each session is confirmed. Rates are locked
                    at booking time and will not change for existing bookings.
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>4. Payouts</h2>
                {/* [REVIEW] Confirm payout schedule and withholding tax obligations */}
                <p style={P}>
                    Your payout for each session is transferred to your nominated bank account within
                    [REVIEW: insert number] business days of session completion. Rehab360 will issue
                    a remittance statement for each payout.
                </p>
                <p style={P}>
                    You are responsible for declaring and paying any applicable taxes on your earnings.
                    Rehab360 may be required by law to withhold tax on payments to practitioners — this
                    will be disclosed to you in your remittance statement. [REVIEW: confirm tax obligations]
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>5. Quality standards and patient safety</h2>
                {/* [REVIEW] Add specific clinical quality standards and complaint procedure */}
                <ul style={{ paddingLeft: "20px", margin: 0 }}>
                    {[
                        "You must complete a session note for every consultation, signed within 24 hours",
                        "You must not conduct a session while impaired",
                        "You must refer any patient whose condition is beyond your competence or requires in-person care",
                        "Patient safety incidents must be reported to Rehab360 within 24 hours",
                        "You consent to anonymised outcome data (pain scores, function scores) being used to evaluate the pilot",
                    ].map((item, i) => <li key={i} style={LI}>{item}</li>)}
                </ul>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>6. Founding Specialist badge</h2>
                <p style={P}>
                    Specialists who complete the pilot onboarding and maintain their MRTB registration
                    will be recognised as Founding Specialists on the platform. This status is displayed
                    on your public profile.
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>7. Data and clinical records</h2>
                {/* [REVIEW] Confirm records ownership and access under Nigerian health law */}
                <p style={P}>
                    Session notes you create remain accessible to you and to the patient you created
                    them for. By accepting this agreement you acknowledge that session notes may be
                    accessed by Rehab360 for clinical audit purposes and by regulatory bodies on
                    lawful request.
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>8. Term and termination</h2>
                {/* [REVIEW] Add notice period for termination; confirm grounds for immediate removal */}
                <p style={P}>
                    This agreement runs for the Pilot Period (1 Dec 2026 – 1 Mar 2027) and continues
                    thereafter on standard terms unless either party gives 30 days&apos; written notice.
                    Rehab360 may remove a specialist immediately for patient safety concerns or
                    regulatory non-compliance.
                </p>
            </div>

            <div style={SECTION}>
                <h2 style={H2}>9. Governing law</h2>
                {/* [REVIEW] Confirm jurisdiction */}
                <p style={P}>
                    This agreement is governed by the laws of the Federal Republic of Nigeria.
                </p>
            </div>

            <p style={{ font: "400 13px 'Figtree',sans-serif", color: "#94a3b8", marginTop: "40px" }}>
                Questions? Email <strong>specialists@rehab360.com.ng</strong> {/* [REVIEW] confirm address */}
            </p>
        </div>
    );
}
