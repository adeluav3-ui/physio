import {
    ConflictException,
    Injectable,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import type { LoginInput, SessionUser, SignUpInput } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { TokenService } from "./token.service.js";
import { MailService } from "../mail/mail.service.js";

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
        private readonly tokens: TokenService,
        private readonly mail: MailService,
    ) { }

    async signUp(input: SignUpInput) {
        const existing = await this.prisma.client.user.findUnique({
            where: { email: input.email },
        });
        if (existing) {
            throw new ConflictException({
                code: "EMAIL_TAKEN",
                message: "An account with that email already exists",
            });
        }

        const passwordHash = await bcrypt.hash(input.password, 12);

        const user = await this.prisma.client.user.create({
            data: {
                email: input.email,
                passwordHash,
                name: input.name,
                role: input.role,
                status: "PENDING",
                ...(input.role === "PATIENT" && { patientProfile: { create: {} } }),
            },
            select: { id: true, email: true, name: true, role: true },
        });

        const verifyToken = await this.tokens.create(user.id, "verify_email", 24);
        await this.mail.sendEmailVerification(user.email, user.name, verifyToken);

        return { userId: user.id };
    }

    async login(input: LoginInput): Promise<{ accessToken: string; user: SessionUser }> {
        const user = await this.prisma.client.user.findUnique({
            where: { email: input.email },
        });
        if (!user) {
            throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "Email or password incorrect" });
        }

        const ok = await bcrypt.compare(input.password, user.passwordHash);
        if (!ok) {
            throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "Email or password incorrect" });
        }

        if (user.status === "SUSPENDED") {
            throw new UnauthorizedException({ code: "ACCOUNT_SUSPENDED", message: "This account is suspended" });
        }

        if (!user.emailVerifiedAt) {
            throw new UnauthorizedException({
                code: "EMAIL_NOT_VERIFIED",
                message: "Please verify your email before signing in",
            });
        }

        const accessToken = await this.jwt.signAsync({
            sub: user.id,
            role: user.role,
            email: user.email,
        });

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                emailVerified: true,
                phone: user.phone ?? undefined,
            },
        };
    }

    async devVerify(email: string) {
        const key = process.env.RESEND_API_KEY ?? "";
        if (!key.startsWith("placeholder")) {
            throw new ForbiddenException({
                code: "DEV_ONLY",
                message: "Dev verification is disabled in this environment",
            });
        }

        const user = await this.prisma.client.user.findUnique({ where: { email } });
        if (!user) throw new NotFoundException({ code: "NOT_FOUND", message: "User not found" });

        await this.prisma.client.user.update({
            where: { id: user.id },
            data: { emailVerifiedAt: new Date(), status: "ACTIVE" },
        });

        return { ok: true };
    }

    async verifyEmail(rawToken: string) {
        const record = await this.tokens.consume(rawToken, "verify_email");

        await this.prisma.client.user.update({
            where: { id: record.userId },
            data: {
                emailVerifiedAt: new Date(),
                status: "ACTIVE",
            },
        });

        return { ok: true };
    }

    async requestPasswordReset(email: string) {
        const user = await this.prisma.client.user.findUnique({ where: { email } });
        // Always return success — do not leak account existence.
        if (user) {
            const token = await this.tokens.create(user.id, "reset_password", 1);
            await this.mail.sendPasswordReset(user.email, user.name, token);
        }
        return { ok: true };
    }

    async resetPassword(rawToken: string, newPassword: string) {
        const record = await this.tokens.consume(rawToken, "reset_password");
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await this.prisma.client.user.update({
            where: { id: record.userId },
            data: { passwordHash },
        });
        return { ok: true };
    }

    async getSession(userId: string): Promise<SessionUser> {
        const user = await this.prisma.client.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                emailVerifiedAt: true,
                phone: true,
            },
        });
        if (!user) {
            throw new UnauthorizedException({ code: "USER_NOT_FOUND", message: "User not found" });
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            emailVerified: Boolean(user.emailVerifiedAt),
            phone: user.phone ?? undefined,
        };
    }
}