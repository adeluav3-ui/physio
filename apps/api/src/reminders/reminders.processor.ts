import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service.js";
import { MailService } from "../mail/mail.service.js";
import { JOB_SESSION_REMINDER, REMINDERS_QUEUE } from "./reminders.constants.js";

@Processor(REMINDERS_QUEUE)
export class RemindersProcessor extends WorkerHost {
    private readonly logger = new Logger(RemindersProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly mail: MailService,
    ) {
        super();
    }

    async process(job: Job<{ appointmentId: string; minutesBefore: number }>): Promise<void> {
        if (job.name !== JOB_SESSION_REMINDER) return;

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

        // Patient reminder
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
}