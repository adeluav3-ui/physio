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
    complaint: z.string().min(5).max(1000),
    bodyRegion,
    onset: z.string().min(2).max(200),
    painScore: z.number().int().min(0).max(10),
    history: z.string().max(2000).optional(),
    medications: z.string().max(1000).optional(),
    redFlagAnswers: z.array(redFlagAnswer).min(1),
});
export type IntakeSubmitInput = z.infer<typeof intakeSubmitSchema>;

export const intakeSchema = intakeSubmitSchema.extend({
    id: idSchema,
    patientId: idSchema,
    createdAt: z.string().datetime(),
});
export type Intake = z.infer<typeof intakeSchema>;