import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { SessionNoteInput, SessionUser } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";

@Injectable()
export class SessionNotesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
        private readonly events: EventEmitter2,
    ) { }

    async upsert(user: SessionUser, input: SessionNoteInput) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: input.appointmentId },
            include: { notes: { select: { signedAt: true } } },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });
        if (appt.physioId !== user.id && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Only the treating physio can write notes" });
        }
        if (appt.notes?.signedAt) {
            throw new ForbiddenException({
                code: "NOTE_SIGNED",
                message: "This note has been signed. Add an addendum instead.",
            });
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
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
            select: { patientId: true, physioId: true },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });
        if (appt.patientId !== user.id && appt.physioId !== user.id && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your appointment" });
        }

        const note = await this.prisma.client.sessionNote.findUnique({
            where: { appointmentId },
            include: { addenda: { orderBy: { addedAt: "asc" } } },
        });
        if (!note) return null;

        await this.audit.record({
            actorId: user.id,
            action: "record.view",
            entity: "SessionNote",
            entityId: note.id,
        });

        return note;
    }

    async sign(user: SessionUser, appointmentId: string) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
            include: { notes: true },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });
        if (appt.physioId !== user.id && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Only the treating physio can sign this note" });
        }

        const note = appt.notes;
        if (!note) throw new NotFoundException({ code: "NOT_FOUND", message: "No note to sign" });
        if (!note.assessment.trim() || !note.plan.trim()) {
            throw new BadRequestException({ code: "INCOMPLETE_NOTE", message: "Assessment and plan are required before signing" });
        }
        if (note.signedAt) {
            return note; // idempotent — already signed
        }

        const signed = await this.prisma.client.sessionNote.update({
            where: { id: note.id },
            data: { signedAt: new Date(), signedBy: user.id },
            include: { addenda: true },
        });

        await this.audit.record({
            actorId: user.id,
            action: "note.sign",
            entity: "SessionNote",
            entityId: note.id,
        });

        this.events.emit("note.signed", { appointmentId, physioId: appt.physioId });
        return signed;
    }

    async addAddendum(user: SessionUser, appointmentId: string, body: string) {
        if (!body?.trim()) {
            throw new BadRequestException({ code: "EMPTY_ADDENDUM", message: "Addendum body cannot be empty" });
        }

        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
            include: { notes: { select: { id: true, signedAt: true } } },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });
        if (appt.physioId !== user.id && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Only the treating physio can add an addendum" });
        }

        const note = appt.notes;
        if (!note) throw new NotFoundException({ code: "NOT_FOUND", message: "No note found for this appointment" });
        if (!note.signedAt) {
            throw new BadRequestException({ code: "NOTE_NOT_SIGNED", message: "Sign the note before adding an addendum" });
        }

        const addendum = await this.prisma.client.noteAddendum.create({
            data: { noteId: note.id, body: body.trim(), addedBy: user.id },
        });

        await this.audit.record({
            actorId: user.id,
            action: "note.addendum",
            entity: "NoteAddendum",
            entityId: addendum.id,
        });

        return addendum;
    }

    async upsertSummary(user: SessionUser, appointmentId: string, body: string) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });
        if (appt.physioId !== user.id && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Only the treating physio can write the patient summary" });
        }

        const summary = await this.prisma.client.patientSummary.upsert({
            where: { appointmentId },
            create: { appointmentId, body },
            update: { body },
        });

        await this.audit.record({
            actorId: user.id,
            action: "record.update",
            entity: "PatientSummary",
            entityId: summary.id,
        });

        return summary;
    }

    async approveSummary(user: SessionUser, appointmentId: string) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
            include: { patientSummary: true },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });
        if (appt.physioId !== user.id && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Only the treating physio can approve the patient summary" });
        }

        const existing = appt.patientSummary;
        if (!existing) {
            throw new NotFoundException({ code: "NOT_FOUND", message: "No patient summary to approve" });
        }
        if (!existing.body?.trim()) {
            throw new BadRequestException({ code: "EMPTY_SUMMARY", message: "Patient summary cannot be empty" });
        }

        const summary = await this.prisma.client.patientSummary.update({
            where: { appointmentId },
            data: { approvedAt: new Date(), approvedBy: user.id },
        });

        await this.audit.record({
            actorId: user.id,
            action: "record.update",
            entity: "PatientSummary",
            entityId: summary.id,
        });

        this.events.emit("patient-summary.approved", {
            appointmentId,
            patientId: appt.patientId,
        });

        return summary;
    }

    async getSummary(user: SessionUser, appointmentId: string) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
            select: { patientId: true, physioId: true },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });
        if (appt.patientId !== user.id && appt.physioId !== user.id && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your appointment" });
        }

        return this.prisma.client.patientSummary.findUnique({ where: { appointmentId } });
    }
}
