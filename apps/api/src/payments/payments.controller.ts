import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { SessionUser } from "@physio/shared";
import { PaymentsService } from "./payments.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";

@Controller("payments")
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly payments: PaymentsService) { }

    @Get("verify/:reference")
    verify(@CurrentUser() user: SessionUser, @Param("reference") reference: string) {
        return this.payments.verifyCharge(user, reference);
    }

    @Get("confirm-callback/:reference")
    confirmCallback(@Param("reference") reference: string) {
        return this.payments.confirmFromCallback(reference);
    }

    @UseGuards(RolesGuard)
    @Roles("PHYSIO")
    @Get("me/wallet")
    getWallet(@CurrentUser() user: SessionUser) {
        return this.payments.getWallet(user.id);
    }

    @UseGuards(RolesGuard)
    @Roles("PHYSIO")
    @Post("me/withdrawal")
    requestWithdrawal(
        @CurrentUser() user: SessionUser,
        @Body() body: { amountKobo: number; bankName: string; accountNumber: string; accountName: string },
    ) {
        return this.payments.requestWithdrawal(user.id, body);
    }
}
