import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminController {
    constructor(private readonly prisma: PrismaService) {}

    @Get("audit")
    async auditLog() {
        return this.prisma.client.auditLog.findMany({
            include: { actor: { select: { name: true, email: true } } },
            orderBy: { at: "desc" },
            take: 500,
        });
    }

    @Get("waitlist")
    async waitlist() {
        return this.prisma.client.waitlistEntry.findMany({
            orderBy: { createdAt: "desc" },
        });
    }
}
