import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { programCreateSchema, type ProgramCreateInput, type SessionUser } from "@physio/shared";
import { ProgramsService, type AddItemInput, type LogInput } from "./programs.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodBody } from "../common/zod-validation.pipe.js";

@Controller("programs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgramsController {
    constructor(private readonly programs: ProgramsService) { }

    @Get("exercises")
    listExercises(
        @Query("q") q?: string,
        @Query("region") region?: string,
        @Query("joint") joint?: string,
        @Query("reviewed") reviewed?: string,
    ) {
        return this.programs.listExercises({
            ...(q && { q }),
            ...(region && { region }),
            ...(joint && { joint }),
            ...(reviewed !== undefined && { reviewed }),
        });
    }

    @Get("today")
    @Roles("PATIENT")
    getToday(@CurrentUser() user: SessionUser) {
        return this.programs.getTodayList(user);
    }

    @Post()
    @Roles("PHYSIO")
    create(@CurrentUser() user: SessionUser, @Body(new ZodBody(programCreateSchema)) body: ProgramCreateInput) {
        return this.programs.create(user, body);
    }

    @Get("patient/:patientId")
    listForPatient(@CurrentUser() user: SessionUser, @Param("patientId") patientId: string) {
        return this.programs.listForPatient(user, patientId);
    }

    @Post(":id/items")
    @Roles("PHYSIO")
    addItem(
        @CurrentUser() user: SessionUser,
        @Param("id") id: string,
        @Body() body: AddItemInput,
    ) {
        return this.programs.addItem(user, id, body);
    }

    @Delete(":id/items/:itemId")
    @Roles("PHYSIO")
    removeItem(
        @CurrentUser() user: SessionUser,
        @Param("id") id: string,
        @Param("itemId") itemId: string,
    ) {
        return this.programs.removeItem(user, id, itemId);
    }

    @Post("items/:itemId/log")
    @Roles("PATIENT")
    logExercise(
        @CurrentUser() user: SessionUser,
        @Param("itemId") itemId: string,
        @Body() body: LogInput,
    ) {
        return this.programs.logExercise(user, itemId, body);
    }

    @Post(":id/send")
    @Roles("PHYSIO")
    sendPlan(@CurrentUser() user: SessionUser, @Param("id") id: string) {
        return this.programs.sendPlan(user, id);
    }

    @Post(":id/discharge")
    @Roles("PHYSIO")
    discharge(
        @CurrentUser() user: SessionUser,
        @Param("id") id: string,
        @Body() body: { dischargeSummary: string; maintenancePlan?: string },
    ) {
        return this.programs.discharge(user, id, body);
    }
}
