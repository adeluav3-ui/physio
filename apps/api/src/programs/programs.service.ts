import { ForbiddenException, Injectable } from "@nestjs/common";
import type { ProgramCreateInput, SessionUser } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";

@Injectable()
export class ProgramsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
    ) { }

    async listExercises() {
        return this.prisma.client.exercise.findMany({ orderBy: [{ region: "asc" }, { difficulty: "asc" }] });
    }

    async create(user: SessionUser, input: ProgramCreateInput) {
        if (user.role !== "PHYSIO") throw new ForbiddenException({ code: "FORBIDDEN", message: "Physio only" });

        // Physio must have at least one appointment with this patient.
        const appointment = await this.prisma.client.appointment.findFirst({
            where: { physioId: user.id, patientId: input.patientId },
        });
        if (!appointment) {
            throw new ForbiddenException({
                code: "FORBIDDEN",
                message: "You have no appointment with this patient",
            });
        }

        const program = await this.prisma.client.program.create({
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

        await this.audit.record({
            actorId: user.id,
            action: "record.update",
            entity: "Program",
            entityId: program.id,
        });

        return program;
    }

    async listForPatient(user: SessionUser, patientId: string) {
        if (user.role === "PATIENT" && user.id !== patientId) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your records" });
        }
        if (user.role === "PHYSIO") {
            const appointment = await this.prisma.client.appointment.findFirst({
                where: { physioId: user.id, patientId },
            });
            if (!appointment) {
                throw new ForbiddenException({
                    code: "FORBIDDEN",
                    message: "You have no appointment with this patient",
                });
            }
        }

        const programs = await this.prisma.client.program.findMany({
            where: { patientId },
            include: { items: { include: { exercise: true, logs: true } } },
            orderBy: { createdAt: "desc" },
        });

        if (programs.length > 0) {
            await this.audit.record({
                actorId: user.id,
                action: "record.view",
                entity: "Program",
                entityId: patientId,
            });
        }

        return programs;
    }
}
