import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { JOB_SESSION_REMINDER, REMINDERS_QUEUE } from "./reminders.constants.js";

@Injectable()
export class RemindersService {
    constructor(@InjectQueue(REMINDERS_QUEUE) private readonly queue: Queue) { }

    async scheduleSessionReminder(appointmentId: string, startsAt: Date) {
        // Fire 24h before the session, and again 1h before.
        const offsets = [24 * 60, 60];
        for (const minutesBefore of offsets) {
            const delay = startsAt.getTime() - minutesBefore * 60_000 - Date.now();
            if (delay <= 0) continue;
            await this.queue.add(
                JOB_SESSION_REMINDER,
                { appointmentId, minutesBefore },
                { delay, removeOnComplete: true, removeOnFail: 100 },
            );
        }
    }
}