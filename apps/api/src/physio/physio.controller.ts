import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
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
    listPublic(
        @Query("discipline") discipline?: string,
        @Query("language") language?: string,
        @Query("mode") mode?: string,
        @Query("maxRate") maxRate?: string,
        @Query("specialty") specialty?: string,
    ) {
        return this.physio.listPublic({
            ...(discipline && { discipline }),
            ...(language && { language }),
            ...(mode && { mode }),
            ...(maxRate && { maxRateKobo: Number(maxRate) * 100 }),
            ...(specialty && { specialtyKeyword: specialty }),
        });
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get("me")
    @Roles("PHYSIO")
    getMe(@CurrentUser() user: SessionUser) {
        return this.physio.getMe(user);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch("me")
    @Roles("PHYSIO")
    updateProfile(
        @CurrentUser() user: SessionUser,
        @Body() body: {
            bio?: string;
            specialties?: string[];
            languages?: string[];
            rateKobo?: number;
            serviceArea?: string;
            photoUrl?: string;
            sessionTypes?: string[];
        },
    ) {
        return this.physio.updateProfile(user, body);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch("me/settings")
    @Roles("PHYSIO")
    updateSettings(
        @CurrentUser() user: SessionUser,
        @Body() body: {
            sessionMinutes?: number;
            bufferMinutes?: number;
            acceptingPatients?: boolean;
            sessionTypes?: string[];
        },
    ) {
        return this.physio.updateSettings(user, body);
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
    @Get("admin/pending/:userId")
    @Roles("ADMIN")
    pendingById(@Param("userId") userId: string) {
        return this.physio.findPendingById(userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post("admin/verify")
    @Roles("ADMIN")
    verify(
        @CurrentUser() admin: SessionUser,
        @Body(new ZodBody(physioVerifySchema)) body: { userId: string; decision: "VERIFIED" | "REJECTED"; reason?: string; mrtbChecked?: boolean },
    ) {
        return this.physio.verify(admin, body.userId, body.decision, body.reason, body.mrtbChecked);
    }
}