import { z } from "zod";
import { idSchema } from "./common.js";

export const bodyRegion = z.enum([
    "NECK",
    "SHOULDER",
    "ELBOW",
    "WRIST_HAND",
    "UPPER_BACK",
    "LOWER_BACK",
    "HIP",
    "KNEE",
    "ANKLE_FOOT",
    "MULTIPLE",
    "OTHER",
]);
export type BodyRegion = z.infer<typeof bodyRegion>;

export const redFlagAnswer = z.object({
    questionId: z.string(),
    answer: z.boolean(),
});

export const intakeSubmitSchema = z.object({
    complaint: z.string(),
    bodyRegion,
    onset: z.string(),
    painScore: z.number().int().min(0).max(10),
    history: z.string().optional(),
    medications: z.string().optional(),
    redFlagAnswers: z.array(redFlagAnswer),
});
export type IntakeSubmitInput = z.infer<typeof intakeSubmitSchema>;

export const intakeSchema = intakeSubmitSchema.extend({
    id: idSchema,
    patientId: idSchema,
    createdAt: z.string().datetime(),
});
export type Intake = z.infer<typeof intakeSchema>;