import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { physioApplySchema, physioVerifySchema, type PhysioApplyInput, type SessionUser } from "@physio/shared";
import { PhysioService } from "./physio.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodBody } from "../common/zod-validation.pipe.js";

@Controller("physios")
export class PhysioController {
    constructor(private readonly physio: PhysioService) { }

    @Get()
    listPublic() {
        return this.physio.listPublic();
    }

    @UseGuards(JwtAuthGuard)
    @Get("me")
    getMyStatus(@CurrentUser() user: SessionUser) {
        return this.physio.getMyApplicationStatus(user);
    }

    @Get(":userId")
    getPublic(@Param("userId") userId: string) {
        return this.physio.getPublic(userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post("apply")
    @Roles("PATIENT", "PHYSIO")
    apply(@CurrentUser() user: SessionUser, @Body(new ZodBody(physioApplySchema)) body: PhysioApplyInput) {
        return this.physio.apply(user, body);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get("admin/pending")
    @Roles("ADMIN")
    pending() {
        return this.physio.listPending();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post("admin/verify")
    @Roles("ADMIN")
    verify(
        @CurrentUser() admin: SessionUser,
        @Body(new ZodBody(physioVerifySchema)) body: { userId: string; decision: "VERIFIED" | "REJECTED"; reason?: string },
    ) {
        return this.physio.verify(admin, body.userId, body.decision, body.reason);
    }
}