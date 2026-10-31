import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Patch,
    Post,
    UseGuards,
} from "@nestjs/common";
import type { ExerciseUpsertInput, SessionUser, SetUserRoleInput } from "@physio/shared";
import { exerciseUpsertSchema, setUserRoleSchema } from "@physio/shared";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodBody } from "../common/zod-validation.pipe.js";
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

    // ── Users ──────────────────────────────────────────────
    @Get("users")
    async users() {
        return this.prisma.client.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                physioProfile: {
                    select: {
                        discipline: true,
                        licenceStatus: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    @Patch("users/:id/role")
    async setUserRole(
        @Param("id") id: string,
        @Body(new ZodBody(setUserRoleSchema)) body: SetUserRoleInput,
        @CurrentUser() caller: SessionUser,
    ) {
        if (id === caller.id) {
            throw new BadRequestException({ code: "SELF_ROLE_CHANGE", message: "You cannot change your own role." });
        }
        const user = await this.prisma.client.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException({ code: "NOT_FOUND", message: "User not found" });
        return this.prisma.client.user.update({
            where: { id },
            data: { role: body.role },
            select: { id: true, name: true, email: true, role: true, status: true },
        });
    }

    // ── Exercise library ───────────────────────────────────
    @Get("exercises")
    async listExercises() {
        return this.prisma.client.exercise.findMany({
            orderBy: [{ category: "asc" }, { name: "asc" }],
        });
    }

    @Post("exercises")
    async createExercise(@Body(new ZodBody(exerciseUpsertSchema)) body: ExerciseUpsertInput) {
        return this.prisma.client.exercise.create({
            data: {
                ...body,
                videoUrl: body.videoUrl ?? null,
                instructions: body.instructions ?? null,
                contraindications: body.contraindications ?? null,
            },
        });
    }

    @Patch("exercises/:id")
    async updateExercise(
        @Param("id") id: string,
        @Body(new ZodBody(exerciseUpsertSchema.partial())) body: Partial<ExerciseUpsertInput>,
    ) {
        const existing = await this.prisma.client.exercise.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException({ code: "NOT_FOUND", message: "Exercise not found" });
        const { videoUrl, instructions, contraindications, ...rest } = body;
        return this.prisma.client.exercise.update({
            where: { id },
            data: {
                ...rest,
                ...(videoUrl !== undefined ? { videoUrl: videoUrl ?? null } : {}),
                ...(instructions !== undefined ? { instructions: instructions ?? null } : {}),
                ...(contraindications !== undefined ? { contraindications: contraindications ?? null } : {}),
            },
        });
    }

    @Delete("exercises/:id")
    async deleteExercise(@Param("id") id: string) {
        const existing = await this.prisma.client.exercise.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException({ code: "NOT_FOUND", message: "Exercise not found" });
        await this.prisma.client.exercise.delete({ where: { id } });
        return { ok: true };
    }
}
