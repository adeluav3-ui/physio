import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { bookAppointmentSchema, type BookAppointmentInput, type SessionUser } from "@physio/shared";
import { BookingService } from "./booking.service.js";
import { AvailabilityService } from "./availability.service.js";
import { SlotService } from "./slot.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodBody } from "../common/zod-validation.pipe.js";

@Controller("booking")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingController {
    constructor(
        private readonly booking: BookingService,
        private readonly availability: AvailabilityService,
        private readonly slots: SlotService,
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

    @Get("appointments")
    listMine(@CurrentUser() user: SessionUser) {
        if (user.role === "ADMIN") return this.booking.listAll();
        return user.role === "PATIENT" ? this.booking.listForPatient(user) : this.booking.listForPhysio(user);
    }

    @Get("appointments/:id")
    getOne(@CurrentUser() user: SessionUser, @Param("id") id: string) {
        return this.booking.getById(user, id);
    }

    @Get("availability/:physioId")
    listAvailability(@Param("physioId") physioId: string) {
        return this.availability.list(physioId);
    }

    @Post("availability")
    @Roles("PHYSIO")
    replaceAvailability(@CurrentUser() user: SessionUser, @Body() body: { slots: any[] }) {
        return this.availability.replaceAll(user, body.slots);
    }
}