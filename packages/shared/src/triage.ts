import { z } from "zod";
import { TriageLevel } from "./enums.js";
import { idSchema } from "./common.js";

export const triageResultSchema = z.object({
    id: idSchema,
    intakeId: idSchema,
    level: TriageLevel,
    reasons: z.array(z.string()),
    ruleIds: z.array(z.string()),
    overriddenBy: idSchema.nullable(),
    createdAt: z.string().datetime(),
});
export type TriageResult = z.infer<typeof triageResultSchema>;

// Rule shape — the engine reads these. Versioned in code, stored on decisions.
export type TriageRule = {
    id: string;                 // e.g. "neuro.saddle_numbness"
    level: TriageLevel;         // what firing this rule implies
    description: string;        // clinician-readable
    questionId?: string;        // maps to redFlagAnswers[].questionId
    evaluate?: (intake: {
        painScore: number;
        redFlagAnswers: Record<string, boolean>;
        bodyRegion: string;
    }) => boolean;               // optional programmatic condition
};

export const triageOverrideSchema = z.object({
    intakeId: idSchema,
    level: TriageLevel,
    reason: z.string(),
});