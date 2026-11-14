import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { RELEASE_DELAY_HOURS } from "@physio/shared";
import { RemindersService } from "./reminders.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class RemindersScheduler implements OnApplicationBootstrap {
    private readonly logger = new Logger(RemindersScheduler.name);

    constructor(
        private readonly reminders: RemindersService,
        private readonly prisma: PrismaService,
    ) {}

    /** On boot, re-schedule reminders for upcoming confirmed appointments and register the daily inactivity check. */
    async onApplicationBootstrap() {
        try {
            const upcoming = await this.prisma.client.appointment.findMany({
                where: { status: "CONFIRMED", startsAt: { gt: new Date() } },
                select: { id: true, startsAt: true },
            });
            for (const a of upcoming) {
                await this.reminders.scheduleSessionReminder(a.id, a.startsAt);
            }
            this.logger.log(`Boot-rescheduled reminders for ${upcoming.length} upcoming appointment(s)`);

            // Register daily inactivity nudge as a repeatable job (runs every 24 h).
            await this.reminders.scheduleInactivityNudge();
            // Register daily referral stall check.
            await this.reminders.scheduleReferralStallCheck();
        } catch (err) {
            this.logger.warn(
                `Boot reminder reschedule skipped — Redis unavailable: ${(err as Error).message}`,
            );
        }
    }

    /** When a note is signed, schedule the delayed payment release. */
    @OnEvent("note.signed")
    async onNoteSigned(payload: { appointmentId: string }) {
        try {
            await this.reminders.schedulePaymentRelease(
                payload.appointmentId,
                RELEASE_DELAY_HOURS * 3600_000,
            );
        } catch (err) {
            this.logger.warn(
                `Failed to schedule payment release for ${payload.appointmentId}: ${(err as Error).message}`,
            );
        }
    }

    /** When a payment confirms a booking, schedule its reminders immediately. */
    @OnEvent("payment.succeeded")
    async onPaymentSucceeded(payload: { appointmentId: string }) {
        try {
            const appt = await this.prisma.client.appointment.findUnique({
                where: { id: payload.appointmentId },
                select: { startsAt: true },
            });
            if (appt) {
                await this.reminders.scheduleSessionReminder(payload.appointmentId, appt.startsAt);
            }
        } catch (err) {
            this.logger.warn(
                `Failed to schedule reminder for appointment ${payload.appointmentId}: ${(err as Error).message}`,
            );
        }
    }
}
