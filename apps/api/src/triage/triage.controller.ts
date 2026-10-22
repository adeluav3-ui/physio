import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
    intakeSubmitSchema,
    triageOverrideSchema,
    type IntakeSubmitInput,
    type SessionUser,
} from "@physio/shared";
import { TriageService } from "./triage.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodBody } from "../common/zod-validation.pipe.js";

@Controller("triage")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TriageController {
    constructor(private readonly triage: TriageService) { }

    @Post("intake")
    @Roles("PATIENT")
    submitIntake(
        @CurrentUser() user: SessionUser,
        @Body(new ZodBody(intakeSubmitSchema)) body: IntakeSubmitInput,
    ) {
        return this.triage.submitIntake(user, body);
    }

    @Get("latest")
    @Roles("PATIENT")
    getLatest(@CurrentUser() user: SessionUser) {
        return this.triage.getLatestIntake(user);
    }

    @Get(":intakeId")
    getResult(@CurrentUser() user: SessionUser, @Param("intakeId") intakeId: string) {
        return this.triage.getByIntake(user, intakeId);
    }

    @Post("override")
    @Roles("ADMIN")
    override(
        @CurrentUser() admin: SessionUser,
        @Body(new ZodBody(triageOverrideSchema)) body: { intakeId: string; level: "GREEN" | "AMBER" | "RED"; reason: string },
    ) {
        return this.triage.override(admin, body.intakeId, body.level, body.reason);
    }
}