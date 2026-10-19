import { PrismaClient } from "../generated/client/client.js";

declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined;
}

export const prisma =
    globalThis.__prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });

if (process.env.NODE_ENV !== "production") globalThis.__prisma = prisma;

export * from "../generated/client/client.js";
export * from "../generated/client/enums.js";
export * from "../generated/client/models.js";