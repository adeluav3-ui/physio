import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import type { SessionUser } from "@physio/shared";
import { ReferralsService, sendReferralSchema, type SendReferralInput } from "./referrals.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodBody } from "../common/zod-validation.pipe.js";

const respondSchema = z.object({
    decision: z.enum(["ACCEPTED", "DECLINED"]),
    reason: z.string().max(500).optional(),
});

@Controller("referrals")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReferralsController {
    constructor(private readonly referrals: ReferralsService) {}

    @Post()
    @Roles("PHYSIO")
    send(
        @CurrentUser() user: SessionUser,
        @Body(new ZodBody(sendReferralSchema)) body: SendReferralInput,
    ) {
        return this.referrals.send(user, body);
    }

    @Get("mine")
    @Roles("PHYSIO")
    listMine(@CurrentUser() user: SessionUser) {
        return this.referrals.listForProfessional(user);
    }

    @Get("patient")
    @Roles("PATIENT")
    listPatient(@CurrentUser() user: SessionUser) {
        return this.referrals.listForPatient(user);
    }

    @Get("admin/all")
    @Roles("ADMIN")
    listAll() {
        return this.referrals.listAll();
    }

    @Get(":id")
    getOne(@CurrentUser() user: SessionUser, @Param("id") id: string) {
        return this.referrals.get(user, id);
    }

    @Get(":id/packet")
    @Roles("PHYSIO", "ADMIN")
    getPacket(@CurrentUser() user: SessionUser, @Param("id") id: string) {
        return this.referrals.getPacket(user, id);
    }

    @Post(":id/consent")
    @Roles("PATIENT")
    consent(@CurrentUser() user: SessionUser, @Param("id") id: string) {
        return this.referrals.consent(user, id);
    }

    @Post(":id/withdraw")
    @Roles("PATIENT")
    withdraw(@CurrentUser() user: SessionUser, @Param("id") id: string) {
        return this.referrals.withdraw(user, id);
    }

    @Post(":id/respond")
    @Roles("PHYSIO")
    respond(
        @CurrentUser() user: SessionUser,
        @Param("id") id: string,
        @Body(new ZodBody(respondSchema)) body: { decision: "ACCEPTED" | "DECLINED"; reason?: string },
    ) {
        return this.referrals.respond(user, id, body.decision, body.reason);
    }
}
