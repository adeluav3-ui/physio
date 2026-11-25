import { z } from "zod";

export const Discipline = z.enum([
    "PHYSIOTHERAPY",
    "OCCUPATIONAL_THERAPY",
    "SPEECH_THERAPY",
    "PROSTHETICS",
    "ORTHOTICS",
]);
export type Discipline = z.infer<typeof Discipline>;

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
    PHYSIOTHERAPY:      "Physiotherapy",
    OCCUPATIONAL_THERAPY: "Occupational Therapy",
    SPEECH_THERAPY:     "Speech & Language Therapy",
    PROSTHETICS:        "Prosthetics",
    ORTHOTICS:          "Orthotics",
};

export const ReferralStatus = z.enum([
    "SENT",
    "PATIENT_CONSENTED",
    "ACCEPTED",
    "DECLINED",
    "BOOKED",
    "SESSION_HELD",
    "SUMMARY_SENT",
    "CONFIRMED",
    "CLOSED",
    "EXPIRED",
]);
export type ReferralStatus = z.infer<typeof ReferralStatus>;

export const ReferralUrgency = z.enum(["ROUTINE", "SOON", "URGENT"]);
export type ReferralUrgency = z.infer<typeof ReferralUrgency>;

export const GoalStatus = z.enum(["ACTIVE", "ACHIEVED", "PAUSED", "CANCELLED"]);
export type GoalStatus = z.infer<typeof GoalStatus>;

export const PlanType = z.enum(["EXERCISE", "GOAL"]);
export type PlanType = z.infer<typeof PlanType>;

export const Role = z.enum(["PATIENT", "PHYSIO", "ADMIN"]);
export type Role = z.infer<typeof Role>;

export const UserStatus = z.enum(["PENDING", "ACTIVE", "SUSPENDED"]);
export type UserStatus = z.infer<typeof UserStatus>;

export const LicenceStatus = z.enum(["UNVERIFIED", "VERIFIED", "REJECTED", "EXPIRED"]);
export type LicenceStatus = z.infer<typeof LicenceStatus>;

export const TriageLevel = z.enum(["GREEN", "FLAG", "IN_PERSON_REQUIRED"]);
export type TriageLevel = z.infer<typeof TriageLevel>;

export const AppointmentType = z.enum([
    "ASSESSMENT",
    "FOLLOW_UP",
    "REASSESSMENT",
    "HOME_VISIT",
]);
export type AppointmentType = z.infer<typeof AppointmentType>;

export const AppointmentStatus = z.enum([
    "PENDING_PAYMENT",
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
    "REFUNDED",
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatus>;

export const SessionMode = z.enum(["VIDEO", "HOME", "CHAT"]);
export type SessionMode = z.infer<typeof SessionMode>;

export const AvailabilityMode = z.enum(["VIDEO", "HOME", "CHAT", "ANY"]);
export type AvailabilityMode = z.infer<typeof AvailabilityMode>;

export const PaymentStatus = z.enum([
    "PENDING",
    "HELD",
    "RELEASED",
    "REFUNDED",
    "FAILED",
]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

export const LedgerEntryType = z.enum([
    "CHARGE",
    "HOLD",
    "RELEASE",
    "PLATFORM_FEE",   // legacy — kept for existing rows; new code uses COMMISSION + SERVICE_FEE
    "COMMISSION",
    "SERVICE_FEE",
    "VIDEO_ADDON",
    "PROCESSOR_FEE",
    "PHYSIO_PAYOUT",
    "REFUND",
]);
export type LedgerEntryType = z.infer<typeof LedgerEntryType>;

export const VideoProviderName = z.enum(["DAILY", "IN_HOUSE"]);
export type VideoProviderName = z.infer<typeof VideoProviderName>;

export const HomeVisitStatus = z.enum([
    "REQUESTED",
    "MATCHING",
    "SCHEDULED",
    "EN_ROUTE",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
]);
export type HomeVisitStatus = z.infer<typeof HomeVisitStatus>;

export const NotificationChannel = z.enum(["EMAIL", "PUSH", "IN_APP", "SMS"]);
export type NotificationChannel = z.infer<typeof NotificationChannel>;