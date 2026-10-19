import { Controller, Get, Param, Post, Body, UseGuards } from "@nestjs/common";
import { PaymentsService } from "./payments.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import type { SessionUser } from "@physio/shared";

@Controller("admin/payments")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class PaymentsAdminController {
    constructor(private readonly payments: PaymentsService) { }

    @Get("ledger")
    ledger() {
        return this.payments.ledgerAll(200);
    }

    @Get("ledger/:appointmentId")
    ledgerForAppointment(@Param("appointmentId") appointmentId: string) {
        return this.payments.ledgerForAppointment(appointmentId);
    }

    @Post("release/:appointmentId")
    release(@CurrentUser() admin: SessionUser, @Param("appointmentId") appointmentId: string) {
        return this.payments.releaseToPhysio(appointmentId);
    }

    @Post("refund/:appointmentId")
    refund(
        @CurrentUser() admin: SessionUser,
        @Param("appointmentId") appointmentId: string,
        @Body() body: { reason: string },
    ) {
        return this.payments.refund(appointmentId, body.reason, admin.id);
    }
}