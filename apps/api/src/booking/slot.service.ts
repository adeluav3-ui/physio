import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

export type Slot = {
    startsAt: string;      // ISO
    durationMinutes: number;
    mode: "VIDEO" | "HOME";
};

const SLOT_DURATION_MIN = 45;

@Injectable()
export class SlotService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Generate bookable slots for a physio over the next N days.
     * Skips slots that overlap with existing CONFIRMED or IN_PROGRESS appointments.
     * Also hides slots inside the "minimum notice" window (default 2h).
     */
    async listForPhysio(physioId: string, daysAhead = 14): Promise<Slot[]> {
        const availability = await this.prisma.client.availability.findMany({
            where: { physioId },
        });
        if (availability.length === 0) return [];

        const existing = await this.prisma.client.appointment.findMany({
            where: {
                physioId,
                status: { in: ["CONFIRMED", "IN_PROGRESS", "PENDING_PAYMENT"] },
                startsAt: { gte: new Date() },
            },
            select: { startsAt: true, endsAt: true },
        });
        const busy = new Set(existing.map((a) => a.startsAt.toISOString()));

        const minNoticeMs = 2 * 60 * 60 * 1000;
        const now = Date.now();
        const slots: Slot[] = [];

        for (let d = 0; d < daysAhead; d++) {
            const day = new Date();
            day.setHours(0, 0, 0, 0);
            day.setDate(day.getDate() + d);
            const weekday = day.getDay();

            const today = availability.filter((a) => a.weekday === weekday);

            for (const block of today) {
                for (
                    let m = block.startMinute;
                    m + SLOT_DURATION_MIN <= block.endMinute;
                    m += SLOT_DURATION_MIN
                ) {
                    const startsAt = new Date(day);
                    startsAt.setMinutes(m);
                    const iso = startsAt.toISOString();

                    if (startsAt.getTime() - now < minNoticeMs) continue;
                    if (busy.has(iso)) continue;

                    slots.push({ startsAt: iso, durationMinutes: SLOT_DURATION_MIN, mode: block.mode });
                }
            }
        }

        return slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    }

    async isSlotBookable(
        physioId: string,
        startsAt: Date,
        durationMinutes: number,
        mode: "VIDEO" | "HOME",
    ): Promise<boolean> {
        const weekday = startsAt.getDay();
        const startMinute = startsAt.getHours() * 60 + startsAt.getMinutes();
        const endMinute = startMinute + durationMinutes;

        const block = await this.prisma.client.availability.findFirst({
            where: {
                physioId,
                weekday,
                mode,
                startMinute: { lte: startMinute },
                endMinute: { gte: endMinute },
            },
        });
        if (!block) return false;

        const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
        const clash = await this.prisma.client.appointment.findFirst({
            where: {
                physioId,
                status: { in: ["CONFIRMED", "IN_PROGRESS", "PENDING_PAYMENT"] },
                OR: [
                    { startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
                ],
            },
        });
        return !clash;
    }
}