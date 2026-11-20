import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import type { SessionUser } from "@physio/shared";
import { PackagesService } from "./packages.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodBody } from "../common/zod-validation.pipe.js";

const purchaseSchema = z.object({
    physioId: z.string().uuid(),
    size: z.union([z.literal(3), z.literal(5), z.literal(10)]),
});

const redeemSchema = z.object({
    appointmentId: z.string().uuid(),
});

@Controller("packages")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PackagesController {
    constructor(private readonly packages: PackagesService) {}

    @Post()
    purchase(
        @CurrentUser() user: SessionUser,
        @Body(new ZodBody(purchaseSchema)) body: { physioId: string; size: 3 | 5 | 10 },
    ) {
        return this.packages.purchase(user, body.physioId, body.size);
    }

    @Get()
    listMine(@CurrentUser() user: SessionUser) {
        return this.packages.listMine(user);
    }

    @Get(":id")
    getOne(@CurrentUser() user: SessionUser, @Param("id") id: string) {
        return this.packages.getOne(user, id);
    }

    @Post(":id/redeem")
    redeem(
        @CurrentUser() user: SessionUser,
        @Param("id") id: string,
        @Body(new ZodBody(redeemSchema)) body: { appointmentId: string },
    ) {
        return this.packages.redeem(user, id, body.appointmentId);
    }

    @Post("checkout")
    @Roles("PATIENT")
    checkout(
        @CurrentUser() user: SessionUser,
        @Body(new ZodBody(purchaseSchema)) body: { physioId: string; size: 3 | 5 | 10 },
    ) {
        return this.packages.checkout(user, body.physioId, body.size);
    }

    @Get(":id/confirm")
    confirmCheckout(
        @CurrentUser() user: SessionUser,
        @Param("id") id: string,
        @Query("ref") ref: string,
    ) {
        return this.packages.confirmCheckout(user, id, ref);
    }
}
