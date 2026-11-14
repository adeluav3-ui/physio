import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { JOB_INACTIVITY_NUDGE, JOB_SESSION_REMINDER, REMINDERS_QUEUE } from "./reminders.constants.js";

@Injectable()
export class RemindersService {
    private readonly logger = new Logger(RemindersService.name);

    constructor(@InjectQueue(REMINDERS_QUEUE) private readonly queue: Queue) {}

    /** Register (or upsert) the daily inactivity-nudge repeatable job. */
    async scheduleInactivityNudge() {
        try {
            await this.queue.add(
                JOB_INACTIVITY_NUDGE,
                {},
                {
                    jobId: "inactivity-nudge:daily",
                    repeat: { every: 24 * 60 * 60 * 1000 },
                    removeOnComplete: true,
                    removeOnFail: 50,
                },
            );
        } catch (err) {
            this.logger.warn(`Could not register inactivity nudge job: ${(err as Error).message}`);
        }
    }

    async scheduleSessionReminder(appointmentId: string, startsAt: Date) {
        const offsets = [24 * 60, 60] as const;
        for (const minutesBefore of offsets) {
            const delay = startsAt.getTime() - minutesBefore * 60_000 - Date.now();
            if (delay <= 0) continue;
            try {
                await this.queue.add(
                    JOB_SESSION_REMINDER,
                    { appointmentId, minutesBefore },
                    {
                        // Deterministic ID prevents duplicate jobs on cold-start reschedule.
                        jobId: `${appointmentId}:${minutesBefore}m`,
                        delay,
                        removeOnComplete: true,
                        removeOnFail: 100,
                    },
                );
            } catch (err) {
                this.logger.warn(
                    `Could not schedule ${minutesBefore}m reminder for ${appointmentId} — Redis may be down: ${(err as Error).message}`,
                );
            }
        }
    }
}
