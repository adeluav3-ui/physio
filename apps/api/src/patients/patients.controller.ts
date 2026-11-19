import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import type { SessionUser } from "@physio/shared";
import { PatientsService, updatePatientSchema } from "./patients.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";

@Controller("patients")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
    constructor(private readonly patients: PatientsService) { }

    @Get("me")
    @Roles("PATIENT")
    getMe(@CurrentUser() user: SessionUser) {
        return this.patients.getMe(user);
    }

    @Put("me")
    @Roles("PATIENT")
    updateMe(@CurrentUser() user: SessionUser, @Body() body: unknown) {
        const parsed = updatePatientSchema.parse(body);
        return this.patients.updateMe(user, parsed);
    }

    @Get(":id/chart")
    @Roles("PHYSIO", "ADMIN")
    getChart(@CurrentUser() user: SessionUser, @Param("id") patientId: string) {
        return this.patients.getChartForPhysio(user, patientId);
    }

    @Get(":id/notes")
    @Roles("PHYSIO", "ADMIN")
    getNotes(@CurrentUser() user: SessionUser, @Param("id") patientId: string) {
        return this.patients.getNotesForPhysio(user, patientId);
    }

    @Get(":id/documents")
    @Roles("PHYSIO", "ADMIN")
    getDocuments(@CurrentUser() user: SessionUser, @Param("id") patientId: string) {
        return this.patients.getDocumentsForPhysio(user, patientId);
    }
}