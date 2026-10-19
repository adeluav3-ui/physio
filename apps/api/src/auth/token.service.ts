import { BadRequestException, Injectable } from "@nestjs/common";
import crypto from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";

type Purpose = "verify_email" | "reset_password";

@Injectable()
export class TokenService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, purpose: Purpose, ttlHours: number) {
        const token = crypto.randomBytes(32).toString("base64url");
        const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

        await this.prisma.client.emailToken.create({
            data: { userId, token, purpose, expiresAt },
        });

        return token;
    }

    async consume(token: string, purpose: Purpose) {
        const record = await this.prisma.client.emailToken.findUnique({ where: { token } });
        if (!record || record.purpose !== purpose) {
            throw new BadRequestException({ code: "INVALID_TOKEN", message: "Invalid or expired link" });
        }
        if (record.usedAt) {
            throw new BadRequestException({ code: "TOKEN_USED", message: "This link has already been used" });
        }
        if (record.expiresAt < new Date()) {
            throw new BadRequestException({ code: "TOKEN_EXPIRED", message: "This link has expired" });
        }

        await this.prisma.client.emailToken.update({
            where: { id: record.id },
            data: { usedAt: new Date() },
        });

        return record;
    }
}