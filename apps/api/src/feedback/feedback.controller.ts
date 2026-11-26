import { Body, Controller, Get, Param, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import type { SessionUser } from "@physio/shared";
import { CurrentUser } from "../common/current-user.decorator.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { FeedbackService } from "./feedback.service.js";

@Controller("feedback")
@UseGuards(JwtAuthGuard)
export class FeedbackController {
    constructor(private readonly feedback: FeedbackService) {}

    @Post()
    submit(
        @CurrentUser() user: SessionUser,
        @Body() body: {
            formType: "PATIENT_SESSION" | "SPECIALIST_SESSION" | "PATIENT_END_OF_PILOT" | "SPECIALIST_END_OF_PILOT";
            appointmentId?: string;
            painScore?: number;
            functionScore?: number;
            overallRating?: number;
            communicationRating?: number;
            whatWentWell?: string;
            whatCouldImprove?: string;
            wouldRecommend?: boolean;
        },
    ) {
        return this.feedback.submit(user, body);
    }

    @Get("session/:appointmentId")
    getForSession(
        @CurrentUser() user: SessionUser,
        @Param("appointmentId") appointmentId: string,
    ) {
        return this.feedback.getForAppointment(user, appointmentId);
    }

    @Get("export/csv")
    @UseGuards(RolesGuard)
    @Roles("ADMIN")
    async exportCsv(@Res() res: Response) {
        const csv = await this.feedback.exportCsv();
        const filename = `rehab360-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(csv);
    }
}
