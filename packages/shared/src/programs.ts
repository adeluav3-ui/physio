import { z } from "zod";
import { idSchema } from "./common.js";

export const exerciseSchema = z.object({
    id: idSchema,
    name: z.string(),
    region: z.string(),
    videoUrl: z.string().url(),
    cues: z.string(),
    contraindications: z.string().nullable(),
    difficulty: z.number().int().min(1).max(5),
});
export type Exercise = z.infer<typeof exerciseSchema>;

export const programItemInputSchema = z.object({
    exerciseId: idSchema,
    sets: z.number().int().min(0).max(20),
    reps: z.number().int().min(0).max(100),
    holdSeconds: z.number().int().min(0).max(300).default(0),
    frequency: z.string().min(1).max(100),
    notes: z.string().max(500).optional(),
});

export const programCreateSchema = z.object({
    patientId: idSchema,
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime().optional(),
    items: z.array(programItemInputSchema).min(1),
});
export type ProgramCreateInput = z.infer<typeof programCreateSchema>;

export const exerciseLogSchema = z.object({
    programItemId: idSchema,
    date: z.string().date(),
    completed: z.boolean(),
    painAfter: z.number().int().min(0).max(10).optional(),
    notes: z.string().max(500).optional(),
});
export type ExerciseLogInput = z.infer<typeof exerciseLogSchema>;