import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { bookAppointmentSchema, type BookAppointmentInput, type SessionUser } from "@physio/shared";
import { BookingService } from "./booking.service.js";
import { AvailabilityService } from "./availability.service.js";
import { SlotService } from "./slot.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodBody } from "../common/zod-validation.pipe.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Controller("booking")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingController {
    constructor(
        private readonly booking: BookingService,
        private readonly availability: AvailabilityService,
        private readonly slots: SlotService,
        private readonly prisma: PrismaService,
    ) { }

    @Get("slots/:physioId")
    listSlots(@Param("physioId") physioId: string, @Query("days") days?: string) {
        return this.slots.listForPhysio(physioId, days ? Number(days) : 14);
    }

    @Post()
    @Roles("PATIENT")
    book(@CurrentUser() user: SessionUser, @Body(new ZodBody(bookAppointmentSchema)) body: BookAppointmentInput) {
        return this.booking.book(user, body);
    }

    @Post("express")
    @Roles("PATIENT")
    bookExpress(@CurrentUser() user: SessionUser, @Body() body: { physioId: string }) {
        return this.booking.bookExpress(user, body.physioId);
    }

    @Get("my-specialists")
    @Roles("PATIENT")
    getMySpecialists(@CurrentUser() user: SessionUser) {
        return this.booking.getMySpecialists(user);
    }

    @Get("appointments")
    listMine(
        @CurrentUser() user: SessionUser,
        @Query("page") page?: string,
        @Query("limit") limit?: string,
    ) {
        if (user.role === "ADMIN") {
            const take = limit ? Math.min(Number(limit), 200) : 50;
            const skip = page ? (Number(page) - 1) * take : 0;
            return this.booking.listAll(user, take, skip);
        }
        return user.role === "PATIENT" ? this.booking.listForPatient(user) : this.booking.listForPhysio(user);
    }

    @Get("appointments/:id")
    getOne(@CurrentUser() user: SessionUser, @Param("id") id: string) {
        return this.booking.getById(user, id);
    }

    @Post("appointments/:id/cancel")
    cancel(
        @CurrentUser() user: SessionUser,
        @Param("id") id: string,
        @Body() body: { reason?: string },
    ) {
        return this.booking.cancel(user, id, body.reason);
    }

    @Post("appointments/:id/dispute")
    @Roles("PATIENT")
    dispute(@CurrentUser() user: SessionUser, @Param("id") id: string) {
        return this.booking.openDispute(user, id);
    }

    @Get("availability/:physioId")
    listAvailability(@Param("physioId") physioId: string) {
        return this.availability.list(physioId);
    }

    @Post("availability")
    @Roles("PHYSIO")
    replaceAvailability(@CurrentUser() user: SessionUser, @Body() body: { slots: unknown[] }) {
        return this.availability.replaceAll(user, body.slots as import("./availability.service.js").AvailabilityInput[]);
    }

    @Get("slots/:physioId/next")
    nextAvailable(@Param("physioId") physioId: string) {
        return this.slots.nextAvailable(physioId).then((startsAt) => ({ startsAt }));
    }

    // ── Days off ─────────────────────────────────────────────────────────────

    @Get("days-off")
    @Roles("PHYSIO")
    listDaysOff(@CurrentUser() user: SessionUser) {
        return this.prisma.client.dayOff.findMany({
            where: { physioId: user.id },
            orderBy: { date: "asc" },
        });
    }

    @Post("days-off")
    @Roles("PHYSIO")
    async addDayOff(
        @CurrentUser() user: SessionUser,
        @Body() body: { date: string; reason?: string },
    ) {
        const date = new Date(body.date);
        return this.prisma.client.dayOff.create({
            data: { physioId: user.id, date, reason: body.reason ?? null },
        });
    }

    @Delete("days-off/:id")
    @Roles("PHYSIO")
    async removeDayOff(@CurrentUser() user: SessionUser, @Param("id") id: string) {
        await this.prisma.client.dayOff.deleteMany({
            where: { id, physioId: user.id },
        });
        return { ok: true };
    }
}