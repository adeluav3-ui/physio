import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { z } from "zod";
import type { SessionUser } from "@physio/shared";
import { REFERRAL_STALL_DAYS, ReferralStatus } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";

export const sendReferralSchema = z.object({
    patientId: z.string().uuid(),
    toDiscipline: z.enum(["PHYSIOTHERAPY", "OCCUPATIONAL_THERAPY", "SPEECH_THERAPY", "PROSTHETICS", "ORTHOTICS"]),
    toProfessionalId: z.string().uuid().optional(),
    reason: z.string().min(10).max(2000),
    urgency: z.enum(["ROUTINE", "SOON", "URGENT"]),
    shareAssessmentNote: z.boolean().default(false),
    sharePlan: z.boolean().default(false),
    appointmentId: z.string().uuid().optional(),
    expiresAt: z.string().datetime().optional(),
});
export type SendReferralInput = z.infer<typeof sendReferralSchema>;

const VALID_TRANSITIONS: Partial<Record<string, string[]>> = {
    SENT: ["PATIENT_CONSENTED", "EXPIRED"],
    PATIENT_CONSENTED: ["ACCEPTED", "DECLINED", "EXPIRED"],
    ACCEPTED: ["BOOKED", "DECLINED"],
    BOOKED: ["SESSION_HELD"],
    SESSION_HELD: ["SUMMARY_SENT"],
    SUMMARY_SENT: ["CONFIRMED"],
    CONFIRMED: ["CLOSED"],
};

@Injectable()
export class ReferralsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
        private readonly events: EventEmitter2,
    ) { }

    private assertTransition(from: string, to: string) {
        const allowed = VALID_TRANSITIONS[from] ?? [];
        if (!allowed.includes(to)) {
            throw new BadRequestException({
                code: "INVALID_TRANSITION",
                message: `Cannot transition from ${from} to ${to}`,
            });
        }
    }

    private async auditTransition(
        tx: Parameters<Parameters<typeof this.prisma.client.$transaction>[0]>[0],
        referralId: string,
        actorId: string,
        fromStatus: string | null,
        toStatus: string,
        note?: string,
    ) {
        return tx.referralAudit.create({
            data: {
                referralId,
                actorId,
                fromStatus: fromStatus as any,
                toStatus: toStatus as any,
                note: note ?? null,
            },
        });
    }

    async send(physio: SessionUser, input: SendReferralInput) {
        if (physio.role !== "PHYSIO") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Physio only" });
        }
        const appointment = await this.prisma.client.appointment.findFirst({
            where: { physioId: physio.id, patientId: input.patientId },
        });
        if (!appointment) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "No appointment with this patient" });
        }

        const referral = await this.prisma.client.$transaction(async (tx) => {
            const ref = await tx.referral.create({
                data: {
                    fromProfessionalId: physio.id,
                    toDiscipline: input.toDiscipline as any,
                    toProfessionalId: input.toProfessionalId ?? null,
                    patientId: input.patientId,
                    reason: input.reason,
                    urgency: input.urgency as any,
                    shareAssessmentNote: input.shareAssessmentNote,
                    sharePlan: input.sharePlan,
                    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
                },
            });
            await this.auditTransition(tx, ref.id, physio.id, null, "SENT");
            return ref;
        });

        this.events.emit("referral.sent", {
            referralId: referral.id,
            fromProfessionalId: physio.id,
            toProfessionalId: referral.toProfessionalId,
            patientId: referral.patientId,
            toDiscipline: referral.toDiscipline,
            urgency: referral.urgency,
        });

        return referral;
    }

    async get(user: SessionUser, referralId: string) {
        const ref = await this.prisma.client.referral.findUnique({
            where: { id: referralId },
            include: {
                patient: { include: { user: { select: { name: true, email: true } } } },
                sender: { include: { user: { select: { name: true } } } },
                receiver: { include: { user: { select: { name: true } } } },
                auditEntries: { orderBy: { at: "asc" } },
            },
        });
        if (!ref) throw new NotFoundException({ code: "NOT_FOUND", message: "Referral not found" });

        const isPhysio = ref.fromProfessionalId === user.id || ref.toProfessionalId === user.id;
        const isPatient = ref.patientId === user.id;
        if (!isPhysio && !isPatient && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your referral" });
        }

        await this.audit.record({
            actorId: user.id,
            action: "record.view",
            entity: "Referral",
            entityId: ref.id,
        });

        return ref;
    }

    async getPacket(user: SessionUser, referralId: string) {
        const ref = await this.prisma.client.referral.findUnique({
            where: { id: referralId },
        });
        if (!ref) throw new NotFoundException({ code: "NOT_FOUND", message: "Referral not found" });

        const isReceiver = ref.toProfessionalId === user.id;
        const isSender = ref.fromProfessionalId === user.id;
        if (!isReceiver && !isSender && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not addressed to you" });
        }
        if (!ref.patientConsented) {
            throw new ForbiddenException({ code: "CONSENT_REQUIRED", message: "Patient has not yet consented to sharing" });
        }

        const packet: Record<string, unknown> = {
            referralId: ref.id,
            reason: ref.reason,
            urgency: ref.urgency,
            toDiscipline: ref.toDiscipline,
        };

        if (ref.shareAssessmentNote) {
            const latestAppt = await this.prisma.client.appointment.findFirst({
                where: {
                    patientId: ref.patientId,
                    physioId: ref.fromProfessionalId,
                    notes: { signedAt: { not: null } },
                },
                orderBy: { startsAt: "desc" },
                include: {
                    notes: {
                        select: { assessment: true, plan: true, outcomeMeasures: true, signedAt: true },
                    },
                },
            });
            if (latestAppt?.notes) {
                packet["assessmentNote"] = {
                    assessment: latestAppt.notes.assessment,
                    plan: latestAppt.notes.plan,
                    outcomeMeasures: latestAppt.notes.outcomeMeasures,
                    signedAt: latestAppt.notes.signedAt,
                };
            }
        }

        if (ref.sharePlan) {
            const program = await this.prisma.client.program.findFirst({
                where: { patientId: ref.patientId, physioId: ref.fromProfessionalId, endsAt: null },
                include: {
                    items: {
                        include: { exercise: { select: { name: true, region: true, cues: true } } },
                    },
                },
            });
            if (program) {
                packet["plan"] = program.items.map((i) => ({
                    exercise: i.exercise.name,
                    region: i.exercise.region,
                    sets: i.sets,
                    reps: i.reps,
                    frequency: i.frequency,
                    notes: i.notes,
                }));
            }
        }

        await this.audit.record({
            actorId: user.id,
            action: "record.view",
            entity: "Referral",
            entityId: ref.id,
        });

        return packet;
    }

    async listForProfessional(physio: SessionUser) {
        return this.prisma.client.referral.findMany({
            where: {
                OR: [
                    { fromProfessionalId: physio.id },
                    { toProfessionalId: physio.id },
                ],
            },
            include: {
                patient: { include: { user: { select: { name: true, email: true } } } },
                sender: { include: { user: { select: { name: true } } } },
                receiver: { include: { user: { select: { name: true } } } },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async listAll() {
        return this.prisma.client.referral.findMany({
            include: {
                patient: { include: { user: { select: { name: true, email: true } } } },
                sender: { include: { user: { select: { name: true } } } },
                receiver: { include: { user: { select: { name: true } } } },
            },
            orderBy: { createdAt: "desc" },
            take: 200,
        });
    }

    async listForPatient(patient: SessionUser) {
        return this.prisma.client.referral.findMany({
            where: { patientId: patient.id },
            include: {
                sender: { include: { user: { select: { name: true } } } },
                receiver: { include: { user: { select: { name: true } } } },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async consent(patient: SessionUser, referralId: string) {
        const ref = await this.prisma.client.referral.findUnique({ where: { id: referralId } });
        if (!ref) throw new NotFoundException({ code: "NOT_FOUND", message: "Referral not found" });
        if (ref.patientId !== patient.id) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your referral" });
        }
        this.assertTransition(ref.status, "PATIENT_CONSENTED");

        const updated = await this.prisma.client.$transaction(async (tx) => {
            const r = await tx.referral.update({
                where: { id: referralId },
                data: { status: "PATIENT_CONSENTED", patientConsented: true, patientConsentedAt: new Date() },
            });
            await this.auditTransition(tx, referralId, patient.id, ref.status, "PATIENT_CONSENTED");
            return r;
        });

        this.events.emit("referral.patient-consented", {
            referralId,
            toProfessionalId: ref.toProfessionalId,
            fromProfessionalId: ref.fromProfessionalId,
            patientId: ref.patientId,
            toDiscipline: ref.toDiscipline,
        });

        return updated;
    }

    async withdraw(patient: SessionUser, referralId: string) {
        const ref = await this.prisma.client.referral.findUnique({ where: { id: referralId } });
        if (!ref) throw new NotFoundException({ code: "NOT_FOUND", message: "Referral not found" });
        if (ref.patientId !== patient.id) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your referral" });
        }
        if (ref.status !== "SENT" && ref.status !== "PATIENT_CONSENTED") {
            throw new BadRequestException({ code: "CANNOT_WITHDRAW", message: "Consent cannot be withdrawn at this stage" });
        }

        return this.prisma.client.$transaction(async (tx) => {
            const updated = await tx.referral.update({
                where: { id: referralId },
                data: { status: "EXPIRED", patientConsented: false },
            });
            await this.auditTransition(tx, referralId, patient.id, ref.status, "EXPIRED", "Patient withdrew consent");
            return updated;
        });
    }

    async respond(physio: SessionUser, referralId: string, decision: "ACCEPTED" | "DECLINED", reason?: string) {
        const ref = await this.prisma.client.referral.findUnique({ where: { id: referralId } });
        if (!ref) throw new NotFoundException({ code: "NOT_FOUND", message: "Referral not found" });
        if (ref.toProfessionalId && ref.toProfessionalId !== physio.id) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not addressed to you" });
        }
        if (decision === "DECLINED" && !reason?.trim()) {
            throw new BadRequestException({ code: "DECLINE_REASON_REQUIRED", message: "A reason is required when declining" });
        }
        this.assertTransition(ref.status, decision);

        const updated = await this.prisma.client.$transaction(async (tx) => {
            const r = await tx.referral.update({
                where: { id: referralId },
                data: {
                    status: decision,
                    toProfessionalId: decision === "ACCEPTED" ? physio.id : ref.toProfessionalId,
                    declineReason: decision === "DECLINED" ? (reason ?? null) : null,
                },
            });
            await this.auditTransition(tx, referralId, physio.id, ref.status, decision, reason);
            return r;
        });

        this.events.emit("referral.responded", {
            referralId,
            fromProfessionalId: ref.fromProfessionalId,
            receiverProfessionalId: physio.id,
            patientId: ref.patientId,
            decision,
            reason,
        });

        return updated;
    }

    /** Called by the daily BullMQ job. Marks stale referrals EXPIRED and returns count. */
    async markStalled(): Promise<number> {
        const cutoff = new Date(Date.now() - REFERRAL_STALL_DAYS * 24 * 3600 * 1000);
        const stale = await this.prisma.client.referral.findMany({
            where: {
                status: { in: ["SENT" as any, "PATIENT_CONSENTED" as any] },
                createdAt: { lt: cutoff },
            },
            select: { id: true, status: true, fromProfessionalId: true },
        });

        if (stale.length === 0) return 0;

        await this.prisma.client.$transaction([
            this.prisma.client.referral.updateMany({
                where: { id: { in: stale.map((r) => r.id) } },
                data: { status: "EXPIRED" as any },
            }),
            this.prisma.client.referralAudit.createMany({
                data: stale.map((ref) => ({
                    referralId: ref.id,
                    actorId: null,
                    fromStatus: ref.status as any,
                    toStatus: "EXPIRED" as any,
                    note: `Auto-expired: no response within ${REFERRAL_STALL_DAYS} days`,
                })),
            }),
        ]);

        for (const ref of stale) {
            this.events.emit("referral.stalled", { referralId: ref.id, fromProfessionalId: ref.fromProfessionalId });
        }
        return stale.length;
    }
}
