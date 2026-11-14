import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";
import { SLOT_HOLD_MINUTES } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";

export const SLOT_HOLD_QUEUE = "slot-holds";
export const JOB_EXPIRE_HOLD = "expire-hold";

@Injectable()
export class SlotHoldService {
    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue(SLOT_HOLD_QUEUE) private readonly queue: Queue,
    ) { }

    async createHold(physioId: string, patientId: string, startsAt: Date, endsAt: Date) {
        const expiresAt = new Date(Date.now() + SLOT_HOLD_MINUTES * 60_000);

        const hold = await this.prisma.client.slotHold.create({
            data: { physioId, patientId, startsAt, endsAt, expiresAt },
        });

        await this.queue.add(
            JOB_EXPIRE_HOLD,
            { holdId: hold.id },
            { delay: SLOT_HOLD_MINUTES * 60_000, jobId: `hold:${hold.id}` },
        );

        return hold;
    }

    async confirmHold(holdId: string, appointmentId: string) {
        await this.queue.remove(`hold:${holdId}`).catch(() => null);
        return this.prisma.client.slotHold.update({
            where: { id: holdId },
            data: { appointmentId },
        });
    }

    async releaseHold(holdId: string) {
        await this.queue.remove(`hold:${holdId}`).catch(() => null);
        await this.prisma.client.slotHold.deleteMany({ where: { id: holdId } });
    }
}
