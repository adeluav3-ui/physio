import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import type { SessionUser } from "@physio/shared";
import { GoalPlansService, goalPlanCreateSchema, type GoalPlanCreateInput } from "./goal-plans.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodBody } from "../common/zod-validation.pipe.js";

const logTaskSchema = z.object({
    completed: z.boolean(),
    note: z.string().max(500).optional(),
});

@Controller("goal-plans")
@UseGuards(JwtAuthGuard, RolesGuard)
export class GoalPlansController {
    constructor(private readonly goalPlans: GoalPlansService) {}

    @Post()
    @Roles("PHYSIO")
    create(
        @CurrentUser() user: SessionUser,
        @Body(new ZodBody(goalPlanCreateSchema)) body: GoalPlanCreateInput,
    ) {
        return this.goalPlans.createForPatient(user, body);
    }

    @Get("mine")
    @Roles("PATIENT")
    listMine(@CurrentUser() user: SessionUser) {
        return this.goalPlans.listForPatient(user);
    }

    @Post("tasks/:taskId/log")
    @Roles("PATIENT")
    logTask(
        @CurrentUser() user: SessionUser,
        @Param("taskId") taskId: string,
        @Body(new ZodBody(logTaskSchema)) body: { completed: boolean; note?: string },
    ) {
        return this.goalPlans.logTask(user, taskId, body.completed, body.note);
    }
}
