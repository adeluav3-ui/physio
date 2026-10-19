import { ForbiddenException, Injectable } from "@nestjs/common";
import type { ProgramCreateInput, SessionUser } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class ProgramsService {
    constructor(private readonly prisma: PrismaService) { }

    async listExercises() {
        return this.prisma.client.exercise.findMany({ orderBy: [{ region: "asc" }, { difficulty: "asc" }] });
    }

    async create(user: SessionUser, input: ProgramCreateInput) {
        if (user.role !== "PHYSIO") throw new ForbiddenException({ code: "FORBIDDEN", message: "Physio only" });

        return this.prisma.client.program.create({
            data: {
                patientId: input.patientId,
                physioId: user.id,
                startsAt: new Date(input.startsAt),
                endsAt: input.endsAt ? new Date(input.endsAt) : null,
                items: {
                    create: input.items.map((i) => ({
                        exerciseId: i.exerciseId,
                        sets: i.sets,
                        reps: i.reps,
                        holdSeconds: i.holdSeconds,
                        frequency: i.frequency,
                        notes: i.notes ?? null,
                    })),
                },
            },
            include: { items: { include: { exercise: true } } },
        });
    }

    async listForPatient(patientId: string) {
        return this.prisma.client.program.findMany({
            where: { patientId },
            include: { items: { include: { exercise: true, logs: true } } },
            orderBy: { createdAt: "desc" },
        });
    }
}