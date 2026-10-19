import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { programCreateSchema, type ProgramCreateInput, type SessionUser } from "@physio/shared";
import { ProgramsService } from "./programs.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodBody } from "../common/zod-validation.pipe.js";

@Controller("programs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgramsController {
    constructor(private readonly programs: ProgramsService) { }

    @Get("exercises")
    listExercises() {
        return this.programs.listExercises();
    }

    @Post()
    @Roles("PHYSIO")
    create(@CurrentUser() user: SessionUser, @Body(new ZodBody(programCreateSchema)) body: ProgramCreateInput) {
        return this.programs.create(user, body);
    }

    @Get("patient/:patientId")
    listForPatient(@Param("patientId") patientId: string) {
        return this.programs.listForPatient(patientId);
    }
}