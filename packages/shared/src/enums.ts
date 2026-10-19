import { z } from "zod";

export const Role = z.enum(["PATIENT", "PHYSIO", "ADMIN"]);
export type Role = z.infer<typeof Role>;

export const UserStatus = z.enum(["PENDING", "ACTIVE", "SUSPENDED"]);
export type UserStatus = z.infer<typeof UserStatus>;

export const LicenceStatus = z.enum(["UNVERIFIED", "VERIFIED", "REJECTED", "EXPIRED"]);
export type LicenceStatus = z.infer<typeof LicenceStatus>;

export const TriageLevel = z.enum(["GREEN", "AMBER", "RED"]);
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

export const SessionMode = z.enum(["VIDEO", "HOME"]);
export type SessionMode = z.infer<typeof SessionMode>;

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
    "PLATFORM_FEE",
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