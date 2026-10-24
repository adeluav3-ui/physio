import { Controller, Get, Inject } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { REDIS } from "../redis/redis.constants.js";
import type Redis from "ioredis";

@Controller("health")
export class HealthController {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(REDIS) private readonly redis: Redis,
    ) {}

    @Get()
    async check() {
        let db: "up" | "down" = "up";
        try {
            await this.prisma.client.$queryRaw`SELECT 1`;
        } catch {
            db = "down";
        }

        let redis: "up" | "down" = "down";
        try {
            const result = await Promise.race([
                this.redis.ping().catch(() => "ERR"),
                new Promise<string>((resolve) => setTimeout(() => resolve("TIMEOUT"), 2000)),
            ]);
            if (result === "PONG") redis = "up";
        } catch {
            redis = "down";
        }

        return {
            status: db === "up" ? "ok" : "degraded",
            uptime: process.uptime(),
            db,
            redis,
        };
    }
}
