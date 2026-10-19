import type { TriageLevel } from "@physio/shared";

/**
 * Triage rules, versioned in code. Bump RULES_VERSION whenever any rule
 * changes so stored decisions can be traced to the rule set that fired.
 *
 * Clinician sign-off required before changing anything in this file.
 */
export const RULES_VERSION = "2026-10-01";

export type Rule = {
    id: string;
    level: TriageLevel;
    questionId: string;
    description: string; // patient-facing reason, plain language
    clinicianNote: string; // internal explanation for audit + admin review
};

export const RULES: Rule[] = [
    // ── RED: block online booking ──────────────────────────
    {
        id: "red.major_trauma",
        level: "RED",
        questionId: "major_trauma",
        description: "You reported a recent major injury or suspected fracture.",
        clinicianNote: "Recent major trauma or suspected fracture — requires in-person imaging/assessment.",
    },
    {
        id: "red.neuro_progressive_weakness",
        level: "RED",
        questionId: "neuro_progressive_weakness",
        description: "You reported weakness that is getting worse over time.",
        clinicianNote: "Progressive neurological weakness — urgent in-person assessment.",
    },
    {
        id: "red.neuro_bladder_bowel",
        level: "RED",
        questionId: "neuro_bladder_bowel",
        description: "You reported new loss of bladder or bowel control.",
        clinicianNote: "Cauda equina red flag — emergency referral.",
    },
    {
        id: "red.neuro_saddle_numbness",
        level: "RED",
        questionId: "neuro_saddle_numbness",
        description: "You reported numbness around the saddle area.",
        clinicianNote: "Cauda equina red flag — emergency referral.",
    },
    {
        id: "red.cardioresp",
        level: "RED",
        questionId: "cardioresp",
        description: "You reported chest pain, breathlessness, or signs of a clot.",
        clinicianNote: "Cardiorespiratory red flag — urgent medical review.",
    },
    {
        id: "red.systemic",
        level: "RED",
        questionId: "systemic",
        description: "You reported unexplained weight loss, fever, or night pain with systemic symptoms.",
        clinicianNote: "Systemic red flag — possible malignancy or infection.",
    },
    {
        id: "red.post_op_complication",
        level: "RED",
        questionId: "post_op_complication",
        description: "You reported wound or swelling complications after recent surgery.",
        clinicianNote: "Post-op complication — surgical review needed.",
    },
    {
        id: "red.severe_worsening",
        level: "RED",
        questionId: "severe_worsening",
        description: "You reported severe pain that is rapidly getting worse.",
        clinicianNote: "Rapidly worsening severe pain — urgent review.",
    },

    // ── AMBER: online first, home visit likely ─────────────
    {
        id: "amber.post_op_planned",
        level: "AMBER",
        questionId: "post_op_planned",
        description: "You are recovering from recent surgery and may need hands-on care.",
        clinicianNote: "Planned post-op rehab — online assessment OK, home visit may be needed.",
    },
    {
        id: "amber.mobility_limited",
        level: "AMBER",
        questionId: "mobility_limited",
        description: "Your mobility is significantly limited and a home visit may be needed.",
        clinicianNote: "Limited mobility — consider home visit for assessment.",
    },
    {
        id: "amber.pain_high",
        level: "AMBER",
        questionId: "pain_high",
        description: "Your pain score is high and may need in-person assessment.",
        clinicianNote: "Pain >= 8 — online assessment OK, flag for possible escalation.",
    },
];

export const RED_FLAG_QUESTIONS = [
    { id: "major_trauma", label: "Have you had a major injury, fall, or suspected fracture in the last 2 weeks?" },
    { id: "neuro_progressive_weakness", label: "Is weakness in your arms or legs getting worse over time?" },
    { id: "neuro_bladder_bowel", label: "Have you had new loss of bladder or bowel control?" },
    { id: "neuro_saddle_numbness", label: "Do you have numbness around the saddle area (inner thighs, groin, buttocks)?" },
    { id: "cardioresp", label: "Do you have chest pain, unusual breathlessness, or signs of a blood clot?" },
    { id: "systemic", label: "Have you had unexplained weight loss, fever, or night pain with feeling unwell?" },
    { id: "post_op_complication", label: "Have you had wound or swelling complications after recent surgery?" },
    { id: "severe_worsening", label: "Is your pain severe and rapidly getting worse?" },
    { id: "post_op_planned", label: "Are you recovering from surgery in the last 6 weeks?" },
    { id: "mobility_limited", label: "Is your mobility significantly limited (e.g. you cannot safely walk to a clinic)?" },
];