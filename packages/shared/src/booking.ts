import { z } from "zod";
import { idSchema } from "./common.js";
import { AppointmentType, SessionMode } from "./enums.js";

export const availabilitySlotSchema = z.object({
    id: idSchema,
    physioId: idSchema,
    weekday: z.number().int().min(0).max(6),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(1).max(1440),
    mode: SessionMode,
});
export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>;

export const bookAppointmentSchema = z.object({
    physioId: idSchema,
    type: AppointmentType,
    mode: SessionMode,
    startsAt: z.string().datetime(),
    durationMinutes: z.number().int().min(15).max(180),
    intakeId: idSchema.optional(), // required for first ASSESSMENT
});
export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;

export const appointmentSchema = z.object({
    id: idSchema,
    patientId: idSchema,
    physioId: idSchema,
    type: AppointmentType,
    mode: SessionMode,
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    status: z.string(),
});
export type Appointment = z.infer<typeof appointmentSchema>;