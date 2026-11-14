import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service.js";
import { SLOT_HOLD_QUEUE, JOB_EXPIRE_HOLD } from "./slot-hold.service.js";

@Processor(SLOT_HOLD_QUEUE)
export class SlotHoldProcessor extends WorkerHost {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async process(job: Job): Promise<void> {
        if (job.name !== JOB_EXPIRE_HOLD) return;
        const { holdId } = job.data as { holdId: string };
        // Delete only holds that were never confirmed (no appointmentId).
        await this.prisma.client.slotHold.deleteMany({
            where: { id: holdId, appointmentId: null },
        });
    }
}
