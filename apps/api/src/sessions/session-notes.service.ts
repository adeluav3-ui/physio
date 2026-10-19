import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { SessionNoteInput, SessionUser } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";

@Injectable()
export class SessionNotesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
    ) { }

    async upsert(user: SessionUser, input: SessionNoteInput) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: input.appointmentId },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });
        if (appt.physioId !== user.id && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Only the treating physio can write notes" });
        }

        const note = await this.prisma.client.sessionNote.upsert({
            where: { appointmentId: input.appointmentId },
            create: {
                appointmentId: input.appointmentId,
                subjective: input.subjective,
                objective: input.objective,
                assessment: input.assessment,
                plan: input.plan,
                outcomeMeasures: input.outcomeMeasures,
            },
            update: {
                subjective: input.subjective,
                objective: input.objective,
                assessment: input.assessment,
                plan: input.plan,
                outcomeMeasures: input.outcomeMeasures,
            },
        });

        await this.audit.record({
            actorId: user.id,
            action: "record.update",
            entity: "SessionNote",
            entityId: note.id,
        });

        return note;
    }

    async get(user: SessionUser, appointmentId: string) {
        const note = await this.prisma.client.sessionNote.findUnique({
            where: { appointmentId },
        });
        if (!note) return null;

        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
            select: { patientId: true, physioId: true },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });
        if (appt.patientId !== user.id && appt.physioId !== user.id && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your appointment" });
        }

        await this.audit.record({
            actorId: user.id,
            action: "record.view",
            entity: "SessionNote",
            entityId: note.id,
        });

        return note;
    }
}