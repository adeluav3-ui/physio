import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { ProgramCreateInput, SessionUser } from "@physio/shared";
import { PAIN_ALERT_THRESHOLD } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";

export type AddItemInput = {
    exerciseId: string;
    sets: number;
    reps: number;
    holdSeconds?: number;
    frequency: string;
    notes?: string;
};

export type LogInput = {
    date?: string;
    completed: boolean;
    feel?: "easy" | "okay" | "painful";
    painAfter?: number;
};

@Injectable()
export class ProgramsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
        private readonly events: EventEmitter2,
    ) { }

    async listExercises(query?: { q?: string; region?: string; joint?: string; reviewed?: string }) {
        const exercises = await this.prisma.client.exercise.findMany({
            where: {
                ...(query?.region && { region: query.region }),
                ...(query?.joint && { joint: query.joint }),
                ...(query?.reviewed !== undefined && { clinicalReview: query.reviewed === "true" }),
            },
            orderBy: [{ region: "asc" }, { difficulty: "asc" }],
        });
        const q = query?.q?.toLowerCase();
        if (!q) return exercises;
        return exercises.filter((ex) =>
            ex.name.toLowerCase().includes(q) ||
            ex.region.toLowerCase().includes(q) ||
            (ex.joint?.toLowerCase().includes(q) ?? false) ||
            (ex.purpose?.toLowerCase().includes(q) ?? false) ||
            (ex.goal?.toLowerCase().includes(q) ?? false) ||
            (ex.conditions?.toLowerCase().includes(q) ?? false) ||
            ex.cues.toLowerCase().includes(q),
        );
    }

    async create(user: SessionUser, input: ProgramCreateInput) {
        if (user.role !== "PHYSIO") throw new ForbiddenException({ code: "FORBIDDEN", message: "Physio only" });

        const appointment = await this.prisma.client.appointment.findFirst({
            where: { physioId: user.id, patientId: input.patientId },
        });
        if (!appointment) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "You have no appointment with this patient" });
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

        await this.audit.record({ actorId: user.id, action: "record.update", entity: "Program", entityId: program.id });
        return program;
    }

    async addItem(user: SessionUser, programId: string, item: AddItemInput) {
        if (user.role !== "PHYSIO") throw new ForbiddenException({ code: "FORBIDDEN", message: "Physio only" });

        const program = await this.prisma.client.program.findUnique({
            where: { id: programId },
        });
        if (!program) throw new NotFoundException({ code: "NOT_FOUND", message: "Program not found" });

        // Verify physio has an appointment with this patient
        const appt = await this.prisma.client.appointment.findFirst({
            where: { physioId: user.id, patientId: program.patientId },
        });
        if (!appt) throw new ForbiddenException({ code: "FORBIDDEN", message: "No appointment with this patient" });

        // Verify the exercise is clinicalReview-approved
        const exercise = await this.prisma.client.exercise.findUnique({
            where: { id: item.exerciseId },
        });
        if (!exercise) throw new NotFoundException({ code: "NOT_FOUND", message: "Exercise not found" });
        if (!exercise.clinicalReview) {
            throw new BadRequestException({ code: "EXERCISE_NOT_REVIEWED", message: "This exercise has not been reviewed. Only reviewed exercises can be added to patient plans." });
        }

        const [newItem] = await this.prisma.client.$transaction([
            this.prisma.client.programItem.create({
                data: {
                    programId,
                    exerciseId: item.exerciseId,
                    sets: item.sets,
                    reps: item.reps,
                    holdSeconds: item.holdSeconds ?? 0,
                    frequency: item.frequency,
                    notes: item.notes ?? null,
                },
                include: { exercise: true },
            }),
            // Bump version to signal plan change
            this.prisma.client.program.update({
                where: { id: programId },
                data: { version: { increment: 1 } },
            }),
        ]);

        await this.audit.record({ actorId: user.id, action: "record.update", entity: "Program", entityId: programId });
        this.events.emit("program.updated", { programId, patientId: program.patientId });

        return newItem;
    }

    async removeItem(user: SessionUser, programId: string, itemId: string) {
        if (user.role !== "PHYSIO") throw new ForbiddenException({ code: "FORBIDDEN", message: "Physio only" });

        const program = await this.prisma.client.program.findUnique({ where: { id: programId } });
        if (!program) throw new NotFoundException({ code: "NOT_FOUND", message: "Program not found" });

        const appt = await this.prisma.client.appointment.findFirst({
            where: { physioId: user.id, patientId: program.patientId },
        });
        if (!appt) throw new ForbiddenException({ code: "FORBIDDEN", message: "No appointment with this patient" });

        await this.prisma.client.$transaction([
            this.prisma.client.programItem.delete({ where: { id: itemId } }),
            this.prisma.client.program.update({
                where: { id: programId },
                data: { version: { increment: 1 } },
            }),
        ]);

        await this.audit.record({ actorId: user.id, action: "record.update", entity: "Program", entityId: programId });
    }

    async getTodayList(user: SessionUser) {
        // Find the most recent active program for this patient
        const programs = await this.prisma.client.program.findMany({
            where: { patientId: user.id },
            include: {
                items: {
                    include: {
                        exercise: true,
                        logs: {
                            where: { date: new Date(new Date().toISOString().slice(0, 10)) },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
        });

        if (programs.length === 0) return { items: [], streak: 0, doneToday: 0, total: 0 };

        const program = programs[0]!;
        const today = new Date().toISOString().slice(0, 10);

        const items = program.items.map((item) => ({
            id: item.id,
            exercise: item.exercise,
            sets: item.sets,
            reps: item.reps,
            holdSeconds: item.holdSeconds,
            frequency: item.frequency,
            notes: item.notes,
            todayLog: item.logs[0] ?? null,
        }));

        const doneToday = items.filter((i) => i.todayLog?.completed).length;

        // Calculate streak: how many consecutive days had all items completed
        const streak = await this.calcStreak(program.id, today);

        await this.audit.record({ actorId: user.id, action: "record.view", entity: "Program", entityId: program.id });

        return { programId: program.id, items, streak, doneToday, total: items.length };
    }

    private async calcStreak(programId: string, today: string): Promise<number> {
        // Get all logs for the last 60 days grouped by date
        const since = new Date(Date.now() - 60 * 24 * 3600 * 1000);
        const logs = await this.prisma.client.exerciseLog.findMany({
            where: {
                programItem: { programId },
                date: { gte: since },
                completed: true,
            },
            select: { date: true },
            orderBy: { date: "desc" },
        });

        const doneDays = new Set(logs.map((l) => l.date.toISOString().slice(0, 10)));
        let streak = 0;
        const cursor = new Date(today);
        while (doneDays.has(cursor.toISOString().slice(0, 10))) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        }
        return streak;
    }

    async logExercise(user: SessionUser, itemId: string, input: LogInput) {
        if (user.role !== "PATIENT") throw new ForbiddenException({ code: "FORBIDDEN", message: "Patient only" });

        const item = await this.prisma.client.programItem.findUnique({
            where: { id: itemId },
            include: { program: { include: { physio: { include: { user: { select: { email: true, name: true } } } } } } },
        });
        if (!item) throw new NotFoundException({ code: "NOT_FOUND", message: "Exercise not found" });
        if (item.program.patientId !== user.id) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your exercise" });
        }

        const date = input.date ? new Date(input.date) : new Date(new Date().toISOString().slice(0, 10));

        const log = await this.prisma.client.exerciseLog.upsert({
            where: { programItemId_date: { programItemId: itemId, date } },
            create: {
                programItemId: itemId,
                date,
                completed: input.completed,
                painAfter: input.painAfter ?? null,
                notes: input.feel ?? null,
            },
            update: {
                completed: input.completed,
                painAfter: input.painAfter ?? null,
                notes: input.feel ?? null,
            },
        });

        // Pain alert: emit event for notification handler
        const painHigh = (input.painAfter !== undefined && input.painAfter >= PAIN_ALERT_THRESHOLD) ||
                         input.feel === "painful";
        if (painHigh) {
            this.events.emit("exercise.pain-alert", {
                patientId: user.id,
                patientName: user.name,
                itemId,
                feel: input.feel,
                painAfter: input.painAfter,
                physioEmail: item.program.physio.user.email,
                physioName: item.program.physio.user.name,
            });
        }

        await this.audit.record({ actorId: user.id, action: "record.update", entity: "ExerciseLog", entityId: log.id });
        return log;
    }

    async sendPlan(user: SessionUser, programId: string) {
        if (user.role !== "PHYSIO") throw new ForbiddenException({ code: "FORBIDDEN", message: "Physio only" });

        const program = await this.prisma.client.program.findUnique({
            where: { id: programId },
            include: { items: { include: { exercise: true } } },
        });
        if (!program) throw new NotFoundException({ code: "NOT_FOUND", message: "Program not found" });

        const appt = await this.prisma.client.appointment.findFirst({
            where: { physioId: user.id, patientId: program.patientId },
        });
        if (!appt) throw new ForbiddenException({ code: "FORBIDDEN", message: "No appointment with this patient" });

        this.events.emit("program.send", { programId, patientId: program.patientId });
        await this.audit.record({ actorId: user.id, action: "record.update", entity: "Program", entityId: programId });

        return { sent: true, exerciseCount: program.items.length };
    }

    async discharge(user: SessionUser, programId: string, input: { dischargeSummary: string; maintenancePlan?: string }) {
        if (user.role !== "PHYSIO") throw new ForbiddenException({ code: "FORBIDDEN", message: "Physio only" });

        const program = await this.prisma.client.program.findUnique({ where: { id: programId } });
        if (!program) throw new NotFoundException({ code: "NOT_FOUND", message: "Program not found" });
        if (program.physioId !== user.id) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your programme" });
        }
        if (program.status === "DISCHARGED") {
            throw new BadRequestException({ code: "ALREADY_DISCHARGED", message: "Programme is already discharged" });
        }

        const updated = await this.prisma.client.program.update({
            where: { id: programId },
            data: {
                status: "DISCHARGED",
                endsAt: new Date(),
                dischargeSummary: input.dischargeSummary,
                maintenancePlan: input.maintenancePlan ?? null,
            },
        });

        await this.audit.record({ actorId: user.id, action: "record.update", entity: "Program", entityId: programId });
        this.events.emit("program.discharged", {
            programId,
            patientId: program.patientId,
            physioId: user.id,
        });

        return updated;
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
                throw new ForbiddenException({ code: "FORBIDDEN", message: "You have no appointment with this patient" });
            }
        }

        const programs = await this.prisma.client.program.findMany({
            where: { patientId },
            include: { items: { include: { exercise: true, logs: true } } },
            orderBy: { createdAt: "desc" },
        });

        if (programs.length > 0) {
            await this.audit.record({ actorId: user.id, action: "record.view", entity: "Program", entityId: patientId });
        }

        return programs;
    }
}
