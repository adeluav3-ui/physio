import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import type { SessionUser } from "@physio/shared";
import { ReviewsService, submitReviewSchema } from "./reviews.service.js";

@UseGuards(JwtAuthGuard)
@Controller("reviews")
export class ReviewsController {
    constructor(private readonly reviews: ReviewsService) {}

    @Post("appointments/:appointmentId")
    submit(
        @CurrentUser() user: SessionUser,
        @Param("appointmentId") appointmentId: string,
        @Body() body: unknown,
    ) {
        const input = submitReviewSchema.parse(body);
        return this.reviews.submit(user, appointmentId, input);
    }

    @Get("appointments/:appointmentId")
    getForAppointment(
        @CurrentUser() user: SessionUser,
        @Param("appointmentId") appointmentId: string,
    ) {
        return this.reviews.getForAppointment(user, appointmentId);
    }

    @Get("physio/:physioId")
    listForPhysio(@Param("physioId") physioId: string) {
        return this.reviews.listForPhysio(physioId);
    }
}
