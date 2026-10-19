import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly resend: Resend | null;
    private readonly from: string;
    private readonly appUrl: string;

    constructor(config: ConfigService) {
        const key = config.get<string>("RESEND_API_KEY");
        this.resend = key ? new Resend(key) : null;
        this.from = config.get<string>("EMAIL_FROM") ?? "Physio <no-reply@physio.local>";
        this.appUrl = config.get<string>("APP_URL") ?? "http://localhost:3000";
    }

    private async send(to: string, subject: string, html: string, text: string) {
        if (!this.resend) {
            this.logger.warn(`RESEND_API_KEY missing — skipping email to ${to}: ${subject}`);
            return;
        }
        try {
            await this.resend.emails.send({ from: this.from, to, subject, html, text });
        } catch (err) {
            // Never let mail failure break a request — log and continue.
            this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
        }
    }

    async sendRaw(to: string, subject: string, html: string, text: string) {
        return this.send(to, subject, html, text);
    }

    async sendEmailVerification(email: string, name: string, token: string) {
        const url = `${this.appUrl}/auth/verify?token=${encodeURIComponent(token)}`;
        await this.send(
            email,
            "Verify your Physio email",
            `<p>Hi ${escapeHtml(name)},</p>
       <p>Confirm your email to activate your Physio account.</p>
       <p><a href="${url}">Verify email</a></p>
       <p>This link expires in 24 hours.</p>`,
            `Hi ${name},\n\nVerify your email: ${url}\n\nThis link expires in 24 hours.`,
        );
    }

    async sendPasswordReset(email: string, name: string, token: string) {
        const url = `${this.appUrl}/auth/reset?token=${encodeURIComponent(token)}`;
        await this.send(
            email,
            "Reset your Physio password",
            `<p>Hi ${escapeHtml(name)},</p>
       <p>Use this link to set a new password. It expires in 1 hour.</p>
       <p><a href="${url}">Reset password</a></p>`,
            `Hi ${name},\n\nReset your password: ${url}\n\nThis link expires in 1 hour.`,
        );
    }
}

function escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
    );
}