import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { type SessionUser, JOIN_WINDOW_MIN, SESSION_HARD_END_MIN } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { VideoService } from "../video/video.service.js";
import { AuditService } from "../audit/audit.service.js";
import { Prisma } from "@physio/db";

@Injectable()
export class SessionsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly video: VideoService,
        private readonly audit: AuditService,
        private readonly events: EventEmitter2,
    ) { }

    /**
     * Both patient and physio call this when they click "Join session".
     * Idempotent: creates the video session if absent, then issues a fresh token.
     */
    async join(user: SessionUser, appointmentId: string) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
            include: { videoSession: true },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });

        const isPatient = appt.patientId === user.id;
        const isPhysio = appt.physioId === user.id;
        if (!isPatient && !isPhysio) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your appointment" });
        }

        if (appt.status !== "CONFIRMED" && appt.status !== "IN_PROGRESS") {
            throw new BadRequestException({
                code: "NOT_JOINABLE",
                message: `Session is ${appt.status.toLowerCase().replace(/_/g, " ")}`,
            });
        }

        const now = Date.now();
        const start = appt.startsAt.getTime();
        const end = appt.endsAt.getTime();
        const early = start - JOIN_WINDOW_MIN * 60_000;
        const late = end + SESSION_HARD_END_MIN * 60_000;

        if (now < early) {
            throw new BadRequestException({
                code: "TOO_EARLY",
                message: `You can join ${JOIN_WINDOW_MIN} minutes before the session`,
            });
        }
        if (now > late) {
            throw new BadRequestException({ code: "TOO_LATE", message: "This session window has passed" });
        }

        // Create the video session on first join (physio is the owner on Daily).
        let roomId = appt.videoSession?.roomId;
        let provider = appt.videoSession?.provider;

        if (!appt.videoSession) {
            const room = await this.video.createRoom(appt.id);
            roomId = room.id;
            provider = this.video.name;
            await this.prisma.client.videoSession.create({
                data: {
                    appointmentId: appt.id,
                    provider: provider === "IN_HOUSE" ? "IN_HOUSE" : "DAILY",
                    roomId,
                },
            });
        } else {
            // Room may have expired — verify it still exists and recreate if not.
            const stillValid = await this.video.verifyRoom(roomId!);
            if (!stillValid) {
                const room = await this.video.createRoom(appt.id);
                roomId = room.id;
                await this.prisma.client.videoSession.update({
                    where: { appointmentId: appt.id },
                    data: { roomId },
                });
            }
        }

        if (appt.status === "CONFIRMED") {
            await this.prisma.client.appointment.update({
                where: { id: appt.id },
                data: { status: "IN_PROGRESS" },
            });
            await this.prisma.client.videoSession.update({
                where: { appointmentId: appt.id },
                data: { startedAt: new Date() },
            });
            await this.audit.record({
                actorId: user.id,
                action: "session.start",
                entity: "Appointment",
                entityId: appt.id,
            });
        }

        const role = isPhysio ? "PHYSIO" : "PATIENT";
        const token = await this.video.issueToken(roomId!, user.id, role);

        return {
            roomId,
            roomUrl: this.video.roomUrl(roomId!),
            token: token.token,
            role,
            appointment: {
                id: appt.id,
                startsAt: appt.startsAt.toISOString(),
                endsAt: appt.endsAt.toISOString(),
            },
        };
    }

    /**
     * Called by either party (or the physio on their way out). Ends the session,
     * marks the appointment COMPLETED, and triggers fund release + program prompt.
     */
    async end(user: SessionUser, appointmentId: string, quality?: Record<string, unknown>) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
            include: { videoSession: true, payment: true },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });

        const isPhysio = appt.physioId === user.id;
        const isAdmin = user.role === "ADMIN";
        // Only the physio (or admin) can end the session. Patients leave the call but
        // the appointment stays IN_PROGRESS until the physio closes it — this gives
        // the physio time to send the program without losing the session context.
        if (!isPhysio && !isAdmin) {
            return { ok: true, stayed: "patient-left-call" };
        }

        if (appt.status === "COMPLETED") return { ok: true };

        await this.prisma.client.$transaction(async (tx) => {
            await tx.appointment.update({
                where: { id: appt.id },
                data: { status: "COMPLETED" },
            });
            if (appt.videoSession) {
                await tx.videoSession.update({
                    where: { appointmentId: appt.id },
                    data: {
                        endedAt: new Date(),
                        quality: (quality ?? {}) as Prisma.InputJsonValue,
                    },
                });
            }
        });

        if (appt.videoSession) {
            try {
                await this.video.endRoom(appt.videoSession.roomId);
            } catch {
                // Non-fatal: room may already have expired.
            }
        }

        await this.audit.record({
            actorId: user.id,
            action: "session.end",
            entity: "Appointment",
            entityId: appt.id,
        });

        this.events.emit("session.completed", { appointmentId: appt.id });
        return { ok: true };
    }

    // ── Diagnostic exercises ──────────────────────────────────────────────────

    async sendDiagnosticExercise(user: SessionUser, appointmentId: string, exerciseId: string) {
        if (user.role !== "PHYSIO") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Physio only" });
        }

        const appt = await this.prisma.client.appointment.findUnique({ where: { id: appointmentId } });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });
        if (appt.physioId !== user.id) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your appointment" });
        }
        if (appt.status !== "IN_PROGRESS" && appt.status !== "CONFIRMED") {
            throw new BadRequestException({ code: "SESSION_NOT_ACTIVE", message: "Session must be active to send exercises" });
        }

        const exercise = await this.prisma.client.exercise.findUnique({ where: { id: exerciseId } });
        if (!exercise) throw new NotFoundException({ code: "NOT_FOUND", message: "Exercise not found" });

        const se = await this.prisma.client.sessionExercise.create({
            data: { appointmentId, exerciseId },
            include: { exercise: true },
        });

        await this.audit.record({
            actorId: user.id,
            action: "record.update",
            entity: "Appointment",
            entityId: appointmentId,
        });

        return se;
    }

    async listDiagnosticExercises(user: SessionUser, appointmentId: string) {
        const appt = await this.prisma.client.appointment.findUnique({ where: { id: appointmentId } });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });
        if (appt.patientId !== user.id && appt.physioId !== user.id && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your appointment" });
        }

        return this.prisma.client.sessionExercise.findMany({
            where: { appointmentId },
            include: { exercise: true },
            orderBy: { sentAt: "asc" },
        });
    }

    async submitDiagnosticFeedback(
        user: SessionUser,
        appointmentId: string,
        sessionExerciseId: string,
        input: { feel?: "easy" | "okay" | "painful"; painScore?: number; feedbackNote?: string },
    ) {
        if (user.role !== "PATIENT") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Patient only" });
        }

        const se = await this.prisma.client.sessionExercise.findUnique({
            where: { id: sessionExerciseId },
        });
        if (!se) throw new NotFoundException({ code: "NOT_FOUND", message: "Session exercise not found" });
        if (se.appointmentId !== appointmentId) {
            throw new BadRequestException({ code: "MISMATCH", message: "Exercise does not belong to this session" });
        }

        const appt = await this.prisma.client.appointment.findUnique({ where: { id: appointmentId } });
        if (!appt || appt.patientId !== user.id) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your appointment" });
        }

        const updated = await this.prisma.client.sessionExercise.update({
            where: { id: sessionExerciseId },
            data: {
                feel: input.feel ?? null,
                painScore: input.painScore ?? null,
                feedbackNote: input.feedbackNote ?? null,
                feedbackAt: new Date(),
            },
            include: { exercise: true },
        });

        await this.audit.record({
            actorId: user.id,
            action: "record.update",
            entity: "Appointment",
            entityId: appointmentId,
        });

        return updated;
    }

    async getForCaller(user: SessionUser, appointmentId: string) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                videoSession: true,
                intake: { include: { triage: true } },
                notes: true,
                physio: { include: { user: { select: { id: true, name: true } } } },
                patient: { include: { user: { select: { id: true, name: true } } } },
                payment: true,
            },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });
        if (appt.patientId !== user.id && appt.physioId !== user.id && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your appointment" });
        }

        this.audit.record({
            actorId: user.id,
            action: "record.view",
            entity: "Appointment",
            entityId: appt.id,
        }).catch(() => {});

        return appt;
    }
}