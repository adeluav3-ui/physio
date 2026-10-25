import { z } from "zod";
import { idSchema } from "./common.js";
import { VideoProviderName } from "./enums.js";

export const sessionNoteSchema = z.object({
    appointmentId: idSchema,
    subjective: z.string(),
    objective: z.string(),
    assessment: z.string(),
    plan: z.string(),
    outcomeMeasures: z.record(z.number()).default({}),
});
export type SessionNoteInput = z.infer<typeof sessionNoteSchema>;

export const videoSessionSchema = z.object({
    id: idSchema,
    appointmentId: idSchema,
    provider: VideoProviderName,
    roomId: z.string(),
    startedAt: z.string().datetime().nullable(),
    endedAt: z.string().datetime().nullable(),
});
export type VideoSession = z.infer<typeof videoSessionSchema>;
