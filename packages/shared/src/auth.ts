import { z } from "zod";
import { emailSchema, idSchema } from "./common.js";
import { Role, UserStatus, Discipline } from "./enums.js";

export const passwordSchema = z.string();

export const signUpSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    name: z.string(),
    isPro: z.boolean().optional(),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string(),
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
    phone: z.string().optional(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

// ── Physio onboarding ─────────────────────
export const ID_TYPES = ["NIN", "DRIVERS_LICENSE", "INTL_PASSPORT", "VOTERS_CARD"] as const;
export type IdType = typeof ID_TYPES[number];
export const ID_TYPE_LABELS: Record<IdType, string> = {
    NIN: "National ID (NIN)",
    DRIVERS_LICENSE: "Driver's License",
    INTL_PASSPORT: "International Passport",
    VOTERS_CARD: "Voter's Card",
};

export const physioApplySchema = z.object({
    discipline: Discipline,
    licenceNo: z.string(),
    licenceDocUrl: z.string().url(),
    certificateUrl: z.string().url(),
    idType: z.enum(ID_TYPES),
    ninNumber: z.string(),  // the ID number (NIN / licence no. / passport no. / voter card no.)
    ninDocUrl: z.string().url(),
    photoUrl: z.string().url(),
    specialties: z.array(z.string()),
    bio: z.string(),
    serviceArea: z.string(),
    // rate is NOT included — session rates are set by admin
});
export type PhysioApplyInput = z.infer<typeof physioApplySchema>;

export const physioVerifySchema = z.object({
    userId: idSchema,
    decision: z.enum(["VERIFIED", "REJECTED"]),
    reason: z.string().optional(),
});

export const setUserRoleSchema = z.object({
    role: z.enum(["PATIENT", "PHYSIO", "ADMIN"]),
});
export type SetUserRoleInput = z.infer<typeof setUserRoleSchema>;
