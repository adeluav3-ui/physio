import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Controller("health")
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    async check() {
        // Cheap query — proves DB is reachable without loading anything.
        await this.prisma.client.$queryRaw`SELECT 1`;
        return { status: "ok", uptime: process.uptime() };
    }
}