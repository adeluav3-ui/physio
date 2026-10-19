import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { RemindersService } from "./reminders.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class RemindersScheduler implements OnApplicationBootstrap {
    constructor(
        private readonly reminders: RemindersService,
        private readonly prisma: PrismaService,
    ) { }

    /** On boot, re-schedule reminders for upcoming confirmed appointments. */
    async onApplicationBootstrap() {
        const upcoming = await this.prisma.client.appointment.findMany({
            where: { status: "CONFIRMED", startsAt: { gt: new Date() } },
            select: { id: true, startsAt: true },
        });
        for (const a of upcoming) {
            await this.reminders.scheduleSessionReminder(a.id, a.startsAt);
        }
    }

    /** When a payment confirms a booking, schedule its reminders. */
    @OnEvent("payment.succeeded")
    async onPaymentSucceeded(payload: { appointmentId: string }) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: payload.appointmentId },
            select: { startsAt: true },
        });
        if (appt) await this.reminders.scheduleSessionReminder(payload.appointmentId, appt.startsAt);
    }
}