import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
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
import type { SessionUser } from "@physio/shared";

@Controller("auth")
export class AuthController {
    constructor(private readonly auth: AuthService) { }

    @Post("signup")
    signUp(@Body(new ZodBody(signUpSchema)) body: SignUpInput) {
        return this.auth.signUp(body);
    }

    @Post("login")
    login(@Body(new ZodBody(loginSchema)) body: LoginInput) {
        return this.auth.login(body);
    }

    @Post("verify-email")
    verifyEmail(@Body(new ZodBody(verifyEmailSchema)) body: { token: string }) {
        return this.auth.verifyEmail(body.token);
    }

    @Post("forgot-password")
    forgotPassword(@Body(new ZodBody(requestPasswordResetSchema)) body: { email: string }) {
        return this.auth.requestPasswordReset(body.email);
    }

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