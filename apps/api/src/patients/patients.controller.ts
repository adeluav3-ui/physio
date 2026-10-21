import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import type { SessionUser } from "@physio/shared";
import { PatientsService, updatePatientSchema } from "./patients.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";

@Controller("patients")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("PATIENT")
export class PatientsController {
    constructor(private readonly patients: PatientsService) { }

    @Get("me")
    getMe(@CurrentUser() user: SessionUser) {
        return this.patients.getMe(user);
    }

    @Put("me")
    updateMe(@CurrentUser() user: SessionUser, @Body() body: unknown) {
        const parsed = updatePatientSchema.parse(body);
        return this.patients.updateMe(user, parsed);
    }
}