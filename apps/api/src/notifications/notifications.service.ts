import { Injectable, Logger } from "@nestjs/common";
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
