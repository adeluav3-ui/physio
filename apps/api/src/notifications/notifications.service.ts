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

    @OnEvent("referral.sent")
    async onReferralSent(payload: {
        referralId: string;
        fromProfessionalId: string;
        toProfessionalId: string | null;
        patientId: string;
        toDiscipline: string;
        urgency: string;
    }) {
        const appUrl = process.env.APP_URL ?? "http://localhost:3000";

        // Email the patient — they need to consent before anything is shared
        const patient = await this.prisma.client.patientProfile.findUnique({
            where: { userId: payload.patientId },
            include: { user: { select: { email: true, name: true } } },
        });
        if (patient) {
            const disciplineLabel = payload.toDiscipline.replace(/_/g, " ").toLowerCase();
            await this.mail.sendRaw(
                patient.user.email,
                "Your specialist has referred you",
                `<p>Hi ${escapeHtml(patient.user.name)},</p>
<p>Your physiotherapist has referred you to a ${escapeHtml(disciplineLabel)} specialist.</p>
<p>Your consent is needed before any of your information is shared. Please review the referral and choose whether to proceed.</p>
<p><a href="${appUrl}/app/referrals">Review referral</a></p>`,
                `Hi ${patient.user.name},\n\nYou have been referred to a ${disciplineLabel} specialist. Your consent is needed.\n\nReview: ${appUrl}/app/referrals`,
            );
        }

        // If a specific receiver is named, notify them too
        if (payload.toProfessionalId) {
            const receiver = await this.prisma.client.physioProfile.findUnique({
                where: { userId: payload.toProfessionalId },
                include: { user: { select: { email: true, name: true } } },
            });
            if (receiver) {
                await this.mail.sendRaw(
                    receiver.user.email,
                    "You have received a referral",
                    `<p>Hi ${escapeHtml(receiver.user.name)},</p>
<p>A colleague has referred a patient to you. The patient must consent before you can view the details.</p>
<p><a href="${appUrl}/pro/referrals">View referrals</a></p>`,
                    `Hi ${receiver.user.name},\n\nA referral is waiting for you at ${appUrl}/pro/referrals`,
                );
            }
        }
    }

    @OnEvent("referral.patient-consented")
    async onReferralPatientConsented(payload: {
        referralId: string;
        toProfessionalId: string | null;
        fromProfessionalId: string;
        patientId: string;
        toDiscipline: string;
    }) {
        if (!payload.toProfessionalId) return; // no named receiver to notify

        const appUrl = process.env.APP_URL ?? "http://localhost:3000";
        const receiver = await this.prisma.client.physioProfile.findUnique({
            where: { userId: payload.toProfessionalId },
            include: { user: { select: { email: true, name: true } } },
        });
        if (!receiver) return;

        await this.mail.sendRaw(
            receiver.user.email,
            "Patient has consented — referral packet is ready",
            `<p>Hi ${escapeHtml(receiver.user.name)},</p>
<p>The patient has consented to sharing their information. You can now review the referral packet and accept or decline.</p>
<p><a href="${appUrl}/pro/referrals">Open referral</a></p>`,
            `Hi ${receiver.user.name},\n\nThe patient has consented. Review the referral: ${appUrl}/pro/referrals`,
        );
    }

    @OnEvent("referral.responded")
    async onReferralResponded(payload: {
        referralId: string;
        fromProfessionalId: string;
        receiverProfessionalId: string;
        patientId: string;
        decision: string;
        reason?: string;
    }) {
        const appUrl = process.env.APP_URL ?? "http://localhost:3000";
        const sender = await this.prisma.client.physioProfile.findUnique({
            where: { userId: payload.fromProfessionalId },
            include: { user: { select: { email: true, name: true } } },
        });
        if (!sender) return;

        if (payload.decision === "ACCEPTED") {
            await this.mail.sendRaw(
                sender.user.email,
                "Your referral has been accepted",
                `<p>Hi ${escapeHtml(sender.user.name)},</p>
<p>The specialist has accepted your referral. The patient can now book their first appointment.</p>
<p><a href="${appUrl}/pro/referrals">View referral</a></p>`,
                `Hi ${sender.user.name},\n\nYour referral was accepted. ${appUrl}/pro/referrals`,
            );
        } else {
            const reasonLine = payload.reason ? `<p>Reason: ${escapeHtml(payload.reason)}</p>` : "";
            await this.mail.sendRaw(
                sender.user.email,
                "Your referral was declined",
                `<p>Hi ${escapeHtml(sender.user.name)},</p>
<p>The specialist has declined your referral.</p>
${reasonLine}
<p>You may refer to another specialist from your referrals page.</p>
<p><a href="${appUrl}/pro/referrals">View referrals</a></p>`,
                `Hi ${sender.user.name},\n\nYour referral was declined${payload.reason ? `: ${payload.reason}` : ""}.\n\nView referrals: ${appUrl}/pro/referrals`,
            );
        }
    }

    @OnEvent("referral.stalled")
    async onReferralStalled(payload: { referralId: string; fromProfessionalId: string }) {
        const appUrl = process.env.APP_URL ?? "http://localhost:3000";
        const sender = await this.prisma.client.physioProfile.findUnique({
            where: { userId: payload.fromProfessionalId },
            include: { user: { select: { email: true, name: true } } },
        });
        if (!sender) return;

        await this.mail.sendRaw(
            sender.user.email,
            "A referral has expired with no response",
            `<p>Hi ${escapeHtml(sender.user.name)},</p>
<p>A referral you sent has expired because no response was received within the expected time.</p>
<p>You may send a new referral if the patient still needs specialist care.</p>
<p><a href="${appUrl}/pro/referrals">View referrals</a></p>`,
            `Hi ${sender.user.name},\n\nA referral expired with no response. View referrals: ${appUrl}/pro/referrals`,
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
