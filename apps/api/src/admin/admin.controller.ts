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
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { hasRedFlagWords } from "@physio/shared";

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
            take: 2000,
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
        });
    }

    // ── Exercise library ──────────────────────────────────────────────────────

    @Get("library")
    async listExercises() {
        return this.prisma.client.exercise.findMany({
            include: { _count: { select: { programItems: true } } },
            orderBy: [{ region: "asc" }, { name: "asc" }],
        });
    }

    @Post("library")
    async createExercise(
        @Body() body: {
            name: string;
            region: string;
            videoUrl: string;
            cues: string;
            contraindications?: string;
            difficulty?: number;
            clinicalReview?: boolean;
        },
    ) {
        return this.prisma.client.exercise.create({ data: { ...body, difficulty: body.difficulty ?? 1 } });
    }

    @Patch("library/:id")
    async updateExercise(
        @Param("id") id: string,
        @Body() body: {
            name?: string;
            region?: string;
            videoUrl?: string;
            cues?: string;
            contraindications?: string;
            difficulty?: number;
            clinicalReview?: boolean;
        },
    ) {
        const ex = await this.prisma.client.exercise.findUnique({ where: { id } });
        if (!ex) throw new NotFoundException({ code: "NOT_FOUND", message: "Exercise not found" });
        return this.prisma.client.exercise.update({ where: { id }, data: body });
    }

    @Delete("library/:id")
    async deleteExercise(@Param("id") id: string) {
        const count = await this.prisma.client.programItem.count({ where: { exerciseId: id } });
        if (count > 0) {
            throw new BadRequestException({
                code: "IN_USE",
                message: `This exercise is used in ${count} programme(s) and cannot be deleted.`,
            });
        }
        await this.prisma.client.exercise.delete({ where: { id } });
        return { deleted: true };
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
