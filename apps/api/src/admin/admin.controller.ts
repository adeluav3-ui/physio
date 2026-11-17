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
    Query,
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
    async listExercises(
        @Query("region") region?: string,
        @Query("joint") joint?: string,
        @Query("reviewed") reviewed?: string,
    ) {
        return this.prisma.client.exercise.findMany({
            where: {
                ...(region && { region }),
                ...(joint && { joint }),
                ...(reviewed !== undefined && { clinicalReview: reviewed === "true" }),
            },
            orderBy: [{ category: "asc" }, { name: "asc" }],
        });
    }

    @Get("exercises/:id")
    async getExercise(@Param("id") id: string) {
        const ex = await this.prisma.client.exercise.findFirst({
            where: { OR: [{ id }, { csvId: id }] },
        });
        if (!ex) throw new NotFoundException({ code: "NOT_FOUND", message: "Exercise not found" });
        return ex;
    }

    @Post("exercises")
    async createExercise(@Body(new ZodBody(exerciseUpsertSchema)) body: ExerciseUpsertInput) {
        const n = (v: string | undefined): string | null => v ?? null;
        return this.prisma.client.exercise.create({
            data: {
                name: body.name,
                category: body.category,
                region: body.region,
                cues: body.cues,
                difficulty: body.difficulty,
                defaultSets: body.defaultSets,
                defaultReps: body.defaultReps,
                defaultHoldSeconds: body.defaultHoldSeconds,
                clinicalReview: body.clinicalReview,
                joint: n(body.joint),
                purpose: n(body.purpose),
                goal: n(body.goal),
                conditions: n(body.conditions),
                position: n(body.position),
                howTo: n(body.howTo),
                dose: n(body.dose),
                progression: n(body.progression),
                precautions: n(body.precautions),
                equipment: n(body.equipment),
                videoStatus: n(body.videoStatus),
                poseKey: n(body.poseKey),
                videoUrl: n(body.videoUrl),
                instructions: n(body.instructions),
                contraindications: n(body.contraindications),
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
        const opt = (key: string, v: string | undefined) => v !== undefined ? { [key]: v ?? null } : {};
        return this.prisma.client.exercise.update({
            where: { id },
            data: {
                ...(body.name !== undefined && { name: body.name }),
                ...(body.category !== undefined && { category: body.category }),
                ...(body.region !== undefined && { region: body.region }),
                ...(body.cues !== undefined && { cues: body.cues }),
                ...(body.difficulty !== undefined && { difficulty: body.difficulty }),
                ...(body.defaultSets !== undefined && { defaultSets: body.defaultSets }),
                ...(body.defaultReps !== undefined && { defaultReps: body.defaultReps }),
                ...(body.defaultHoldSeconds !== undefined && { defaultHoldSeconds: body.defaultHoldSeconds }),
                ...(body.clinicalReview !== undefined && { clinicalReview: body.clinicalReview }),
                ...opt("joint", body.joint),
                ...opt("purpose", body.purpose),
                ...opt("goal", body.goal),
                ...opt("conditions", body.conditions),
                ...opt("position", body.position),
                ...opt("howTo", body.howTo),
                ...opt("dose", body.dose),
                ...opt("progression", body.progression),
                ...opt("precautions", body.precautions),
                ...opt("equipment", body.equipment),
                ...opt("videoStatus", body.videoStatus),
                ...opt("poseKey", body.poseKey),
                ...opt("videoUrl", body.videoUrl),
                ...opt("instructions", body.instructions),
                ...opt("contraindications", body.contraindications),
            },
        });
    }

    @Delete("exercises/:id")
    async deleteExercise(@Param("id") id: string) {
        const inUse = await this.prisma.client.programItem.count({ where: { exerciseId: id } });
        if (inUse > 0) throw new BadRequestException({ code: "EXERCISE_IN_USE", message: "Exercise is used in one or more patient programs and cannot be deleted." });
        const existing = await this.prisma.client.exercise.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException({ code: "NOT_FOUND", message: "Exercise not found" });
        await this.prisma.client.exercise.delete({ where: { id } });
        return { ok: true };
    }
}
