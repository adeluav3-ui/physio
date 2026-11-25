import type { TriageLevel } from "@physio/shared";

/**
 * Triage rules, versioned in code. Bump RULES_VERSION whenever any rule
 * changes so stored decisions can be traced to the rule set that fired.
 *
 * Clinician sign-off required before changing anything in this file.
 */
export const RULES_VERSION = "2026-11-24";

export type Rule = {
    id: string;
    level: TriageLevel;
    questionId: string;
    description: string; // patient-facing reason, plain language
    clinicianNote: string; // internal explanation for audit + admin review
};

export const RULES: Rule[] = [
    // ── IN_PERSON_REQUIRED: block online booking ───────────────────────────────
    {
        id: "in_person.major_trauma",
        level: "IN_PERSON_REQUIRED",
        questionId: "major_trauma",
        description: "You reported a recent major injury or suspected fracture.",
        clinicianNote: "Recent major trauma or suspected fracture — requires in-person imaging/assessment.",
    },
    {
        id: "in_person.neuro_progressive_weakness",
        level: "IN_PERSON_REQUIRED",
        questionId: "neuro_progressive_weakness",
        description: "You reported weakness that is getting worse over time.",
        clinicianNote: "Progressive neurological weakness — urgent in-person assessment.",
    },
    {
        id: "in_person.neuro_bladder_bowel",
        level: "IN_PERSON_REQUIRED",
        questionId: "neuro_bladder_bowel",
        description: "You reported new loss of bladder or bowel control.",
        clinicianNote: "Cauda equina red flag — emergency referral.",
    },
    {
        id: "in_person.neuro_saddle_numbness",
        level: "IN_PERSON_REQUIRED",
        questionId: "neuro_saddle_numbness",
        description: "You reported numbness around the saddle area.",
        clinicianNote: "Cauda equina red flag — emergency referral.",
    },
    {
        id: "in_person.cardioresp",
        level: "IN_PERSON_REQUIRED",
        questionId: "cardioresp",
        description: "You reported chest pain, breathlessness, or signs of a clot.",
        clinicianNote: "Cardiorespiratory red flag — urgent medical review.",
    },
    {
        id: "in_person.systemic",
        level: "IN_PERSON_REQUIRED",
        questionId: "systemic",
        description: "You reported unexplained weight loss, fever, or night pain with systemic symptoms.",
        clinicianNote: "Systemic red flag — possible malignancy or infection.",
    },
    {
        id: "in_person.post_op_complication",
        level: "IN_PERSON_REQUIRED",
        questionId: "post_op_complication",
        description: "You reported wound or swelling complications after recent surgery.",
        clinicianNote: "Post-op complication — surgical review needed.",
    },
    {
        id: "in_person.severe_worsening",
        level: "IN_PERSON_REQUIRED",
        questionId: "severe_worsening",
        description: "You reported severe pain that is rapidly getting worse.",
        clinicianNote: "Rapidly worsening severe pain — urgent review.",
    },

    // ── FLAG: online OK, physio should review carefully ───────────────────────
    {
        id: "flag.post_op_planned",
        level: "FLAG",
        questionId: "post_op_planned",
        description: "You are recovering from recent surgery and may need hands-on care.",
        clinicianNote: "Planned post-op rehab — online assessment OK, home visit may be needed.",
    },
    {
        id: "flag.mobility_limited",
        level: "FLAG",
        questionId: "mobility_limited",
        description: "Your mobility is significantly limited and a home visit may be needed.",
        clinicianNote: "Limited mobility — consider home visit for assessment.",
    },
    {
        id: "flag.pain_high",
        level: "FLAG",
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
