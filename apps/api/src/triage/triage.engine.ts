import type { TriageLevel } from "@physio/shared";
import { RULES, type Rule } from "./rules.js";

export type TriageInput = {
    painScore: number;
    redFlagAnswers: Record<string, boolean>;
};

export type TriageDecision = {
    level: TriageLevel;
    reasons: string[];
    ruleIds: string[];
};

/**
 * Deterministic rules engine. No AI, no heuristics — every decision traces
 * to specific rule IDs. Red wins over amber wins over green.
 */
export function evaluate(input: TriageInput): TriageDecision {
    const fired: Rule[] = [];

    for (const rule of RULES) {
        const answer = input.redFlagAnswers[rule.questionId];
        if (rule.questionId === "pain_high") {
            if (input.painScore >= 8) fired.push(rule);
            continue;
        }
        if (answer === true) fired.push(rule);
    }

    if (fired.length === 0) {
        return { level: "GREEN", reasons: ["No red flags reported."], ruleIds: [] };
    }

    const hasRed = fired.some((r) => r.level === "IN_PERSON_REQUIRED");
    const level: TriageLevel = hasRed ? "IN_PERSON_REQUIRED" : "FLAG";

    return {
        level,
        reasons: fired.map((r) => r.description),
        ruleIds: fired.map((r) => r.id),
    };
}