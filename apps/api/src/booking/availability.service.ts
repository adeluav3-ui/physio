import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import type { SessionUser } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";

export type AvailabilityInput = {
    weekday: number; // 0=Sun .. 6=Sat
    startMinute: number;
    endMinute: number;
    mode: "VIDEO" | "HOME" | "CHAT" | "ANY";
};

@Injectable()
export class AvailabilityService {
    constructor(private readonly prisma: PrismaService) { }

    async list(physioId: string) {
        return this.prisma.client.availability.findMany({
            where: { physioId },
            orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
        });
    }

    async replaceAll(actor: SessionUser, slots: AvailabilityInput[]) {
        if (actor.role !== "PHYSIO") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Only physios can edit availability" });
        }

        // Validate: no overlaps within the same weekday+mode.
        for (const weekday of [0, 1, 2, 3, 4, 5, 6]) {
            for (const mode of ["VIDEO", "HOME", "CHAT", "ANY"] as const) {
                const day = slots
                    .filter((s) => s.weekday === weekday && s.mode === mode)
                    .sort((a, b) => a.startMinute - b.startMinute);
                for (let i = 1; i < day.length; i++) {
                    const prev = day[i - 1]!;
                    const cur = day[i]!;
                    if (cur.startMinute < prev.endMinute) {
                        throw new BadRequestException({
                            code: "OVERLAP",
                            message: `Overlapping slots on weekday ${weekday} (${mode})`,
                        });
                    }
                }
            }
        }

        await this.prisma.client.$transaction(async (tx) => {
            await tx.availability.deleteMany({ where: { physioId: actor.id } });
            if (slots.length > 0) {
                await tx.availability.createMany({
                    data: slots.map((s) => ({
                        physioId: actor.id,
                        weekday: s.weekday,
                        startMinute: s.startMinute,
                        endMinute: s.endMinute,
                        mode: s.mode,
                    })),
                });
            }
        });

        return this.list(actor.id);
    }
}