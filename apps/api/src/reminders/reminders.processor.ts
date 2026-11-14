import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { INACTIVITY_NUDGE_DAYS } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { MailService } from "../mail/mail.service.js";
import { PaymentsService } from "../payments/payments.service.js";
import { ReferralsService } from "../referrals/referrals.service.js";
import { JOB_INACTIVITY_NUDGE, JOB_PAYMENT_RELEASE, JOB_REFERRAL_STALL, JOB_SESSION_REMINDER, REMINDERS_QUEUE } from "./reminders.constants.js";

@Processor(REMINDERS_QUEUE)
export class RemindersProcessor extends WorkerHost {
    private readonly logger = new Logger(RemindersProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly mail: MailService,
        private readonly payments: PaymentsService,
        private readonly referrals: ReferralsService,
    ) {
        super();
    }

    async process(job: Job): Promise<void> {
        if (job.name === JOB_SESSION_REMINDER) {
            await this.handleSessionReminder(job as Job<{ appointmentId: string; minutesBefore: number }>);
        } else if (job.name === JOB_INACTIVITY_NUDGE) {
            await this.handleInactivityNudge();
        } else if (job.name === JOB_PAYMENT_RELEASE) {
            await this.handlePaymentRelease(job as Job<{ appointmentId: string }>);
        } else if (job.name === JOB_REFERRAL_STALL) {
            await this.handleReferralStall();
        }
    }

    private async handleReferralStall() {
        const count = await this.referrals.markStalled();
        this.logger.log(`Referral stall check: expired ${count} referral(s)`);
    }

    private async handlePaymentRelease(job: Job<{ appointmentId: string }>) {
        await this.payments.releaseToPhysio(job.data.appointmentId);
        this.logger.log(`Payment released for appointment ${job.data.appointmentId}`);
    }

    private async handleSessionReminder(job: Job<{ appointmentId: string; minutesBefore: number }>) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: job.data.appointmentId },
            include: {
                patient: { include: { user: true } },
                physio: { include: { user: true } },
            },
        });
        if (!appt || appt.status !== "CONFIRMED") return;

        const when = appt.startsAt.toLocaleString("en-NG", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });

        await this.mail.sendRaw(
            appt.patient.user.email,
            `Reminder: physio session ${when}`,
            `<p>Your session with ${appt.physio.user.name} is in ${job.data.minutesBefore} minutes.</p>`,
            `Reminder: your session with ${appt.physio.user.name} starts ${when}.`,
        );
        await this.mail.sendRaw(
            appt.physio.user.email,
            `Reminder: session with ${appt.patient.user.name} ${when}`,
            `<p>Your session with ${appt.patient.user.name} is in ${job.data.minutesBefore} minutes.</p>`,
            `Reminder: session with ${appt.patient.user.name} starts ${when}.`,
        );
        this.logger.log(`Reminder sent for appointment ${appt.id} (${job.data.minutesBefore}m)`);
    }

    private async handleInactivityNudge() {
        const cutoff = new Date(Date.now() - INACTIVITY_NUDGE_DAYS * 24 * 3600 * 1000);
        const appUrl = process.env.APP_URL ?? "http://localhost:3000";

        // Find patients who have an active program but no exercise log since cutoff.
        const programs = await this.prisma.client.program.findMany({
            where: {
                endsAt: null,
                items: { some: {} },
            },
            include: {
                patient: { include: { user: { select: { email: true, name: true } } } },
                items: {
                    include: {
                        logs: {
                            where: { date: { gte: cutoff } },
                            take: 1,
                        },
                    },
                    take: 1,
                },
            },
        });

        let nudged = 0;
        for (const prog of programs) {
            const hasRecentLog = prog.items.some((item) => item.logs.length > 0);
            if (!hasRecentLog) {
                await this.mail.sendRaw(
                    prog.patient.user.email,
                    "Keep going — your exercises are waiting",
                    `<p>Hi ${prog.patient.user.name},</p>
<p>It looks like you have not done your exercises for a few days. Your plan is still there whenever you are ready.</p>
<p><a href="${appUrl}/app/plan">Open your plan</a></p>`,
                    `Hi ${prog.patient.user.name},\n\nYour exercises are waiting. Open your plan: ${appUrl}/app/plan`,
                );
                nudged++;
            }
        }
        this.logger.log(`Inactivity nudge: sent ${nudged} email(s)`);
    }
}
