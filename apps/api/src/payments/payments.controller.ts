import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { PaymentsService } from "./payments.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";

@Controller("payments")
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly payments: PaymentsService) { }

    @Get("verify/:reference")
    verify(@Param("reference") reference: string) {
        return this.payments.verifyCharge(reference);
    }
}