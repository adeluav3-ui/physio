import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import type { SessionUser } from "@physio/shared";
import { PaymentsService } from "./payments.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";

@Controller("payments")
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly payments: PaymentsService) { }

    @Get("verify/:reference")
    verify(@CurrentUser() user: SessionUser, @Param("reference") reference: string) {
        return this.payments.verifyCharge(user, reference);
    }
}
