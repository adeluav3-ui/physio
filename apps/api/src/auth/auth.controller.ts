import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
    loginSchema,
    requestPasswordResetSchema,
    resetPasswordSchema,
    signUpSchema,
    verifyEmailSchema,
    type LoginInput,
    type SignUpInput,
} from "@physio/shared";
import { AuthService } from "./auth.service.js";
import { ZodBody } from "../common/zod-validation.pipe.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { IpEmailThrottlerGuard, IpOnlyThrottlerGuard } from "./throttler-guards.js";
import type { SessionUser } from "@physio/shared";

@Controller("auth")
export class AuthController {
    constructor(private readonly auth: AuthService) { }

    // 20 attempts per hour per IP+email + 50 per hour per IP
    @UseGuards(IpEmailThrottlerGuard, IpOnlyThrottlerGuard)
    @Throttle({ global: { limit: 20, ttl: 3_600_000 }, ip: { limit: 50, ttl: 3_600_000 } })
    @Post("signup")
    signUp(@Body(new ZodBody(signUpSchema)) body: SignUpInput) {
        return this.auth.signUp(body);
    }

    // 10 attempts per 15 min per IP+email + 30 per 15 min per IP
    @UseGuards(IpEmailThrottlerGuard, IpOnlyThrottlerGuard)
    @Throttle({ global: { limit: 10, ttl: 900_000 }, ip: { limit: 30, ttl: 900_000 } })
    @Post("login")
    login(@Body(new ZodBody(loginSchema)) body: LoginInput) {
        return this.auth.login(body);
    }

    // 5 attempts per 15 min per IP
    @Throttle({ global: { limit: 5, ttl: 900_000 } })
    @Post("verify-email")
    verifyEmail(@Body(new ZodBody(verifyEmailSchema)) body: { token: string }) {
        return this.auth.verifyEmail(body.token);
    }

    // 5 attempts per hour per IP+email (prevents email enumeration via timing)
    @UseGuards(IpEmailThrottlerGuard)
    @Throttle({ global: { limit: 5, ttl: 3_600_000 } })
    @Post("forgot-password")
    forgotPassword(@Body(new ZodBody(requestPasswordResetSchema)) body: { email: string }) {
        return this.auth.requestPasswordReset(body.email);
    }

    // 5 attempts per 15 min per IP
    @Throttle({ global: { limit: 5, ttl: 900_000 } })
    @Post("reset-password")
    resetPassword(
        @Body(new ZodBody(resetPasswordSchema)) body: { token: string; password: string },
    ) {
        return this.auth.resetPassword(body.token, body.password);
    }

    @Post("dev-verify")
    devVerify(@Body() body: { email: string }) {
        return this.auth.devVerify(body.email);
    }

    @UseGuards(JwtAuthGuard)
    @Get("me")
    me(@CurrentUser() user: SessionUser) {
        return user;
    }
}