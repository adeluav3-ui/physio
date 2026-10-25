import { z } from "zod";
import { idSchema } from "./common.js";
import { HomeVisitStatus } from "./enums.js";

export const homeVisitRequestSchema = z.object({
    appointmentId: idSchema,
    address: z.string(),
    geo: z.object({ lat: z.number(), lng: z.number() }),
    notes: z.string().optional(),
});
export type HomeVisitRequestInput = z.infer<typeof homeVisitRequestSchema>;

export const homeVisitCheckSchema = z.object({
    visitId: idSchema,
    action: z.enum(["CHECK_IN", "CHECK_OUT", "PANIC"]),
    geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
});