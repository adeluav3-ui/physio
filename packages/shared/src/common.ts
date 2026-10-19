import { z } from "zod";

export const idSchema = z.string().uuid();

export const paginationSchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof paginationSchema>;

export const paginated = <T extends z.ZodTypeAny>(item: T) =>
    z.object({
        items: z.array(item),
        nextCursor: z.string().nullable(),
    });

export type ApiError = {
    code: string;
    message: string;
    details?: unknown;
};

export const phoneSchema = z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, "Invalid phone number")
    .optional();

export const emailSchema = z.string().email().max(254).toLowerCase();