import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { MailService } from "../mail/mail.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private readonly mail: MailService,
        private readonly prisma: PrismaService,
    ) { }

    async sendAppointmentConfirmed(appointmentId: string) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                patient: { include: { user: { select: { email: true, name: true } } } },
                physio: { include: { user: { select: { email: true, name: true } } } },
            },
        });

        if (!appt) {
            this.logger.warn(`sendAppointmentConfirmed: appointment ${appointmentId} not found`);
            return;
        }

        const patientEmail = appt.patient.user.email;
        const patientName = appt.patient.user.name;
        const physioEmail = appt.physio.user.email;
        const physioName = appt.physio.user.name;

        const startTime = new Date(appt.startsAt);
        const displayDate = startTime.toLocaleDateString("en-NG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "Africa/Lagos",
        });
        const displayTime = startTime.toLocaleTimeString("en-NG", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Africa/Lagos",
        });

        const icsContent = buildIcs({
            uid: appointmentId,
            start: appt.startsAt,
            end: appt.endsAt,
            summary: `Session with ${physioName}`,
            description: `Your ${appt.mode.toLowerCase()} session on Rehab360.`,
        });

        await this.mail.sendWithIcs(
            patientEmail,
            "Your physiotherapy appointment is confirmed",
            appointmentEmailHtml({
                recipientName: patientName,
                otherPartyRole: "physiotherapist",
                otherPartyName: physioName,
                displayDate,
                displayTime,
                mode: appt.mode,
                appointmentId,
            }),
            appointmentEmailText({
                recipientName: patientName,
                otherPartyRole: "physiotherapist",
                otherPartyName: physioName,
                displayDate,
                displayTime,
                mode: appt.mode,
                appointmentId,
            }),
            icsContent,
        );

        await this.mail.sendWithIcs(
            physioEmail,
            "New appointment confirmed",
            appointmentEmailHtml({
                recipientName: physioName,
                otherPartyRole: "patient",
                otherPartyName: patientName,
                displayDate,
                displayTime,
                mode: appt.mode,
                appointmentId,
            }),
            appointmentEmailText({
                recipientName: physioName,
                otherPartyRole: "patient",
                otherPartyName: patientName,
                displayDate,
                displayTime,
                mode: appt.mode,
                appointmentId,
            }),
            icsContent,
        );

        this.logger.log(`Appointment confirmed emails sent for ${appointmentId}`);
    }

    @OnEvent("exercise.pain-alert")
    async onExercisePainAlert(payload: {
        patientId: string;
        patientName: string;
        physioEmail: string;
        physioName: string;
        feel?: string;
        painAfter?: number;
    }) {
        const appUrl = process.env.APP_URL ?? "http://localhost:3000";
        const feel = payload.feel ?? "painful";
        const score = payload.painAfter !== undefined ? ` (${payload.painAfter}/10)` : "";
        await this.mail.sendRaw(
            payload.physioEmail,
            `Pain alert: ${payload.patientName} reported ${feel} during exercise`,
            `<p>Hi ${escapeHtml(payload.physioName)},</p>
<p>${escapeHtml(payload.patientName)} reported <strong>${escapeHtml(feel)}</strong>${score} after completing an exercise in their home programme.</p>
<p>You may want to <a href="${appUrl}/pro/patients">review their plan</a> and check in with them.</p>`,
            `Hi ${payload.physioName},\n\n${payload.patientName} reported ${feel}${score} after a home exercise.\n\nCheck their plan: ${appUrl}/pro/patients`,
        );
    }

    @OnEvent("patient-summary.approved")
    async onPatientSummaryApproved(payload: { appointmentId: string; patientId: string }) {
        const patient = await this.prisma.client.patientProfile.findUnique({
            where: { userId: payload.patientId },
            include: { user: { select: { email: true, name: true } } },
        });
        if (!patient) return;

        const appUrl = process.env.APP_URL ?? "http://localhost:3000";
        await this.mail.sendRaw(
            patient.user.email,
            "Your session summary is ready",
            `<p>Hi ${escapeHtml(patient.user.name)},</p>
<p>Your professional has shared a summary of your recent session.</p>
<p><a href="${appUrl}/app/appointments/${payload.appointmentId}/summary">Read your summary</a></p>`,
            `Hi ${patient.user.name},\n\nYour professional has shared a summary of your recent session.\n\nRead it here: ${appUrl}/app/appointments/${payload.appointmentId}/summary`,
        );
        this.logger.log(`Patient summary email sent for appointment ${payload.appointmentId}`);
    }

    @OnEvent("program.send")
    async onProgramSend(payload: { programId: string; patientId: string }) {
        const patient = await this.prisma.client.patientProfile.findUnique({
            where: { userId: payload.patientId },
            include: { user: { select: { email: true, name: true } } },
        });
        if (!patient) return;

        const appUrl = process.env.APP_URL ?? "http://localhost:3000";
        await this.mail.sendRaw(
            patient.user.email,
            "Your exercise plan has been updated",
            `<p>Hi ${escapeHtml(patient.user.name)},</p>
<p>Your physiotherapist has updated your exercise plan.</p>
<p><a href="${appUrl}/app/plan">View your plan</a></p>`,
            `Hi ${patient.user.name},\n\nYour exercise plan has been updated.\n\nView it here: ${appUrl}/app/plan`,
        );
    }
}

interface EmailParams {
    recipientName: string;
    otherPartyRole: string;
    otherPartyName: string;
    displayDate: string;
    displayTime: string;
    mode: string;
    appointmentId: string;
}

function escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
    );
}

function appointmentEmailHtml(p: EmailParams): string {
    const joinLine =
        p.mode === "VIDEO"
            ? `<p>To join via video, go to your <a href="/app/appointments/${p.appointmentId}">appointments page</a> and click <strong>Join session</strong> when it is time.</p>`
            : `<p>This is an in-person session. Your ${escapeHtml(p.otherPartyRole)} will contact you with the location details.</p>`;

    return `<p>Hi ${escapeHtml(p.recipientName)},</p>
<p>Your appointment with ${escapeHtml(p.otherPartyRole)} <strong>${escapeHtml(p.otherPartyName)}</strong> has been confirmed.</p>
<p><strong>Date:</strong> ${escapeHtml(p.displayDate)}<br>
<strong>Time:</strong> ${escapeHtml(p.displayTime)} WAT</p>
${joinLine}
<p>If you need to cancel or reschedule, please do so at least 24 hours in advance.</p>`;
}

function buildIcs(opts: { uid: string; start: Date; end: Date; summary: string; description: string }): string {
    const fmt = (d: Date) =>
        d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Rehab360//Rehab360//EN",
        "BEGIN:VEVENT",
        `UID:${opts.uid}@rehab360.app`,
        `DTSTART:${fmt(opts.start)}`,
        `DTEND:${fmt(opts.end)}`,
        `SUMMARY:${opts.summary}`,
        `DESCRIPTION:${opts.description}`,
        "END:VEVENT",
        "END:VCALENDAR",
    ].join("\r\n");
}

function appointmentEmailText(p: EmailParams): string {
    const joinLine =
        p.mode === "VIDEO"
            ? `To join via video, visit /app/appointments/${p.appointmentId} and click "Join session" when it is time.`
            : `This is an in-person session. Your ${p.otherPartyRole} will contact you with the location details.`;

    return `Hi ${p.recipientName},

Your appointment with ${p.otherPartyRole} ${p.otherPartyName} has been confirmed.

Date: ${p.displayDate}
Time: ${p.displayTime} WAT

${joinLine}

If you need to cancel or reschedule, please do so at least 24 hours in advance.`;
}
