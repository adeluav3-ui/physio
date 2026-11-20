import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import type { SessionUser } from "@physio/shared";
import { WalletService } from "./wallet.service.js";

@Controller("wallet")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("PATIENT")
export class WalletController {
    constructor(private readonly wallet: WalletService) {}

    @Get("me")
    getBalance(@CurrentUser() user: SessionUser) {
        return this.wallet.getBalance(user);
    }

    @Post("deposit")
    initiateDeposit(
        @CurrentUser() user: SessionUser,
        @Body() body: { amountKobo: number },
    ) {
        return this.wallet.initiateDeposit(user, body.amountKobo);
    }

    @Get("deposit/confirm")
    confirmDeposit(
        @CurrentUser() user: SessionUser,
        @Query("ref") ref: string,
    ) {
        return this.wallet.confirmDeposit(user, ref);
    }
}
