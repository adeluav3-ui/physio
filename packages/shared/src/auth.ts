import { z } from "zod";
import { emailSchema, idSchema, phoneSchema } from "./common.js";
import { Role, UserStatus } from "./enums.js";

export const passwordSchema = z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(128)
    .regex(/[A-Za-z]/, "Must contain a letter")
    .regex(/\d/, "Must contain a number");

export const signUpSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    name: z.string().min(2).max(120),
    role: z.literal(Role.enum.PATIENT), // physios onboard separately
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({ token: z.string().min(16) });

export const requestPasswordResetSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({
    token: z.string().min(16),
    password: passwordSchema,
});

export const sessionUserSchema = z.object({
    id: idSchema,
    email: emailSchema,
    name: z.string(),
    role: Role,
    status: UserStatus,
    emailVerified: z.boolean(),
    phone: phoneSchema,
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

// ── Physio onboarding ─────────────────────
export const physioApplySchema = z.object({
    licenceNo: z.string().min(3).max(60),
    specialties: z.array(z.string().min(2)).min(1).max(10),
    bio: z.string().min(50).max(2000),
    rate: z.number().int().min(0).max(1_000_000), // kobo
    serviceArea: z.string().min(2).max(200),
});
export type PhysioApplyInput = z.infer<typeof physioApplySchema>;

export const physioVerifySchema = z.object({
    userId: idSchema,
    decision: z.enum(["VERIFIED", "REJECTED"]),
    reason: z.string().max(500).optional(),
});