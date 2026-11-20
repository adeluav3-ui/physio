import { Injectable } from "@nestjs/common";
import { DEFAULT_SESSION_MIN, DEFAULT_BUFFER_MIN } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";

export type Slot = {
    startsAt: string;      // ISO
    durationMinutes: number;
    mode: "VIDEO" | "HOME" | "CHAT" | "ANY";
};

const MIN_NOTICE_MS = 2 * 60 * 60 * 1000; // 2 hours

@Injectable()
export class SlotService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Generate bookable slots for a physio over the next N days.
     * Respects the professional's sessionMinutes and bufferMinutes.
     * Skips slots inside active holds, busy appointments, or days-off.
     */
    async listForPhysio(physioId: string, daysAhead = 14): Promise<Slot[]> {
        const [availability, profile] = await Promise.all([
            this.prisma.client.availability.findMany({ where: { physioId } }),
            this.prisma.client.physioProfile.findUnique({
                where: { userId: physioId },
                select: {
                    sessionMinutes: true,
                    bufferMinutes: true,
                    acceptingPatients: true,
                },
            }),
        ]);

        if (availability.length === 0) return [];
        if (!profile?.acceptingPatients) return [];

        const sessionMin = profile.sessionMinutes ?? DEFAULT_SESSION_MIN;
        const bufferMin = profile.bufferMinutes ?? DEFAULT_BUFFER_MIN;
        const stepMin = sessionMin + bufferMin;

        const windowStart = new Date();
        const windowEnd = new Date();
        windowEnd.setDate(windowEnd.getDate() + daysAhead);

        const [existing, holds, daysOff] = await Promise.all([
            this.prisma.client.appointment.findMany({
                where: {
                    physioId,
                    status: { in: ["CONFIRMED", "IN_PROGRESS", "PENDING_PAYMENT"] },
                    startsAt: { gte: windowStart, lt: windowEnd },
                },
                select: { startsAt: true, endsAt: true },
            }),
            this.prisma.client.slotHold.findMany({
                where: {
                    physioId,
                    expiresAt: { gt: new Date() },
                    startsAt: { gte: windowStart, lt: windowEnd },
                },
                select: { startsAt: true, endsAt: true },
            }),
            this.prisma.client.dayOff.findMany({
                where: {
                    physioId,
                    date: { gte: windowStart, lt: windowEnd },
                },
                select: { date: true },
            }),
        ]);

        const daysOffSet = new Set(
            daysOff.map((d) => d.date.toISOString().slice(0, 10)),
        );

        const busyRanges = [
            ...existing.map((a) => ({ start: a.startsAt.getTime(), end: a.endsAt.getTime() })),
            ...holds.map((h) => ({ start: h.startsAt.getTime(), end: h.endsAt.getTime() })),
        ];

        const now = Date.now();
        const slots: Slot[] = [];

        for (let d = 0; d < daysAhead; d++) {
            const now2 = new Date();
            const day = new Date(Date.UTC(now2.getUTCFullYear(), now2.getUTCMonth(), now2.getUTCDate() + d));

            const dateKey = day.toISOString().slice(0, 10);
            if (daysOffSet.has(dateKey)) continue;

            const weekday = day.getUTCDay();
            const todayBlocks = availability.filter((a) => a.weekday === weekday);

            for (const block of todayBlocks) {
                for (
                    let m = block.startMinute;
                    m + sessionMin <= block.endMinute;
                    m += stepMin
                ) {
                    const startsAt = new Date(day.getTime() + m * 60_000);
                    const endsAt = new Date(startsAt.getTime() + sessionMin * 60_000);

                    if (startsAt.getTime() - now < MIN_NOTICE_MS) continue;

                    const overlaps = busyRanges.some(
                        (r) => startsAt.getTime() < r.end && endsAt.getTime() > r.start,
                    );
                    if (overlaps) continue;

                    slots.push({
                        startsAt: startsAt.toISOString(),
                        durationMinutes: sessionMin,
                        mode: block.mode as "VIDEO" | "HOME" | "CHAT" | "ANY",
                    });
                }
            }
        }

        return slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    }

    /** Returns the first available slot date, or null if none in the next 60 days. */
    async nextAvailable(physioId: string): Promise<string | null> {
        const slots = await this.listForPhysio(physioId, 60);
        return slots[0]?.startsAt ?? null;
    }

    async isSlotBookable(
        physioId: string,
        startsAt: Date,
        durationMinutes: number,
        mode: "VIDEO" | "HOME" | "CHAT",
    ): Promise<boolean> {
        const weekday = startsAt.getDay();
        const startMinute = startsAt.getHours() * 60 + startsAt.getMinutes();
        const endMinute = startMinute + durationMinutes;

        // Match either the exact mode or ANY (pro accepts all modes for this block)
        const block = await this.prisma.client.availability.findFirst({
            where: {
                physioId,
                weekday,
                mode: { in: [mode, "ANY"] },
                startMinute: { lte: startMinute },
                endMinute: { gte: endMinute },
            },
        });
        if (!block) return false;

        const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

        const dateKey = startsAt.toISOString().slice(0, 10);
        const dayOff = await this.prisma.client.dayOff.findUnique({
            where: { physioId_date: { physioId, date: new Date(dateKey) } },
        });
        if (dayOff) return false;

        const clash = await this.prisma.client.appointment.findFirst({
            where: {
                physioId,
                status: { in: ["CONFIRMED", "IN_PROGRESS", "PENDING_PAYMENT"] },
                OR: [{ startsAt: { lt: endsAt }, endsAt: { gt: startsAt } }],
            },
        });
        if (clash) return false;

        const holdClash = await this.prisma.client.slotHold.findFirst({
            where: {
                physioId,
                expiresAt: { gt: new Date() },
                OR: [{ startsAt: { lt: endsAt }, endsAt: { gt: startsAt } }],
            },
        });
        return !holdClash;
    }
}
