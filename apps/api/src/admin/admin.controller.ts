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
    Put,
    Query,
    UseGuards,
} from "@nestjs/common";
import { Prisma } from "@physio/db";
import type { ExerciseUpsertInput, SessionUser, SetUserRoleInput } from "@physio/shared";
import { exerciseUpsertSchema, setUserRoleSchema, hasRedFlagWords } from "@physio/shared";
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

    // ── Audit ─────────────────────────────────────────────────────────────────

    @Get("audit")
    async auditLog() {
        return this.prisma.client.auditLog.findMany({
            include: { actor: { select: { name: true, email: true } } },
            orderBy: { at: "desc" },
            take: 500,
        });
    }

    // ── Waitlist ──────────────────────────────────────────────────────────────

    @Get("waitlist")
    async waitlist() {
        return this.prisma.client.waitlistEntry.findMany({
            orderBy: { createdAt: "desc" },
            take: 200,
        });
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    @Get("users")
    async listUsers() {
        return this.prisma.client.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                emailVerifiedAt: true,
                physioProfile: { select: { licenceStatus: true, discipline: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    @Patch("users/:id")
    async updateUser(@Param("id") id: string, @Body() body: { status?: "ACTIVE" | "SUSPENDED" }) {
        const user = await this.prisma.client.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException({ code: "NOT_FOUND", message: "User not found" });
        return this.prisma.client.user.update({
            where: { id },
            data: { ...(body.status && { status: body.status }) },
            select: { id: true, name: true, email: true, role: true, status: true },
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

    @Delete("users/:id")
    async deleteUser(@Param("id") id: string) {
        const user = await this.prisma.client.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException({ code: "NOT_FOUND", message: "User not found" });
        if (user.role === "ADMIN") {
            throw new BadRequestException({ code: "CANNOT_DELETE_ADMIN", message: "Cannot delete an admin account" });
        }

        const hasAppointments = await this.prisma.client.appointment.count({
            where: user.role === "PHYSIO"
                ? { physioId: id }
                : { patientId: id },
        });
        if (hasAppointments > 0) {
            throw new BadRequestException({
                code: "HAS_APPOINTMENTS",
                message: "Cannot delete a user who has appointment history. Suspend the account instead.",
            });
        }

        await this.prisma.client.user.delete({ where: { id } });
        return { deleted: true };
    }

    // ── Analytics ─────────────────────────────────────────────────────────────

    @Get("analytics")
    async analytics() {
        const [
            totalUsers,
            totalPhysios,
            totalPatients,
            totalAppointments,
            completedAppointments,
            pendingVerifications,
            totalRevenue,
            activePrograms,
            totalReviews,
            avgRating,
        ] = await Promise.all([
            this.prisma.client.user.count(),
            this.prisma.client.user.count({ where: { role: "PHYSIO" } }),
            this.prisma.client.user.count({ where: { role: "PATIENT" } }),
            this.prisma.client.appointment.count(),
            this.prisma.client.appointment.count({ where: { status: "COMPLETED" } }),
            this.prisma.client.physioProfile.count({ where: { licenceStatus: "UNVERIFIED" } }),
            this.prisma.client.ledgerEntry.aggregate({
                _sum: { amountKobo: true },
                where: { type: "CHARGE" },
            }),
            this.prisma.client.program.count({ where: { status: "ACTIVE" } }),
            this.prisma.client.review.count(),
            this.prisma.client.review.aggregate({ _avg: { rating: true } }),
        ]);

        const recentAppointments = await this.prisma.client.appointment.findMany({
            where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600_000) } },
            select: { createdAt: true, status: true },
            orderBy: { createdAt: "asc" },
        });

        return {
            totalUsers,
            totalPhysios,
            totalPatients,
            totalAppointments,
            completedAppointments,
            pendingVerifications,
            revenueKobo: totalRevenue._sum.amountKobo ?? 0,
            activePrograms,
            totalReviews,
            averageRating: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : null,
            recentAppointments,
        };
    }

    // ── Triage ────────────────────────────────────────────────────────────────

    @Get("triage")
    async triageResults() {
        return this.prisma.client.triageResult.findMany({
            include: {
                intake: {
                    select: {
                        complaint: true,
                        bodyRegion: true,
                        painScore: true,
                        createdAt: true,
                        patient: { select: { user: { select: { name: true, email: true } } } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 500,
        });
    }

    // ── Incidents (red-flag messages) ─────────────────────────────────────────

    @Get("incidents")
    async incidents() {
        const messages = await this.prisma.client.message.findMany({
            include: {
                sender: { select: { name: true, role: true } },
                thread: {
                    select: {
                        patient: { select: { name: true, email: true } },
                        physio: { select: { name: true } },
                    },
                },
            },
            orderBy: { sentAt: "desc" },
            take: 500,
        });
        return messages.filter((m) => hasRedFlagWords(m.body));
    }

    // ── Home visits ───────────────────────────────────────────────────────────

    @Get("home-visits")
    async homeVisits() {
        return this.prisma.client.homeVisit.findMany({
            include: {
                appointment: {
                    select: {
                        startsAt: true,
                        status: true,
                        patient: { select: { user: { select: { name: true } } } },
                        physio: { select: { user: { select: { name: true } } } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
    }

    // ── Exercise library ──────────────────────────────────────────────────────

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

    @Post("exercises/bulk-approve-animated")
    async bulkApproveAnimated() {
        const result = await this.prisma.client.exercise.updateMany({
            where: { poseKey: { not: null }, clinicalReview: false },
            data: { clinicalReview: true },
        });
        return { approved: result.count };
    }

    // ── Animation overrides ───────────────────────────────────────────────────

    @Put("exercises/:id/animation")
    async setExerciseAnimation(
        @Param("id") id: string,
        @Body() body: unknown,
    ) {
        if (!body || typeof body !== "object" || Array.isArray(body)) {
            throw new BadRequestException({ code: "INVALID_BODY", message: "Body must be a JSON object" });
        }
        const existing = await this.prisma.client.exercise.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException({ code: "NOT_FOUND", message: "Exercise not found" });
        return this.prisma.client.exercise.update({
            where: { id },
            data: { poseData: body as Prisma.InputJsonValue },
            select: { id: true, csvId: true, poseData: true },
        });
    }

    @Delete("exercises/:id/animation")
    async clearExerciseAnimation(@Param("id") id: string) {
        const existing = await this.prisma.client.exercise.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException({ code: "NOT_FOUND", message: "Exercise not found" });
        return this.prisma.client.exercise.update({
            where: { id },
            data: { poseData: Prisma.DbNull },
            select: { id: true, csvId: true, poseData: true },
        });
    }

    // ── Payments ledger ───────────────────────────────────────────────────────

    @Get("payments/ledger")
    async ledger() {
        return this.prisma.client.ledgerEntry.findMany({
            include: {
                appointment: {
                    select: {
                        patient: { select: { user: { select: { name: true } } } },
                        physio: { select: { user: { select: { name: true } } } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 1000,
        });
    }
}
