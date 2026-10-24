import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { z } from "zod";
import type { SessionUser } from "@physio/shared";
import { ReferralStatus } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";

export const sendReferralSchema = z.object({
    patientId: z.string().uuid(),
    toDiscipline: z.enum(["PHYSIOTHERAPY", "OCCUPATIONAL_THERAPY", "SPEECH_THERAPY", "PROSTHETICS", "ORTHOTICS"]),
    toProfessionalId: z.string().uuid().optional(),
    reason: z.string().min(10).max(2000),
    urgency: z.enum(["ROUTINE", "SOON", "URGENT"]),
    shareAssessmentNote: z.boolean().default(false),
    sharePlan: z.boolean().default(false),
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
    constructor(private readonly prisma: PrismaService) {}

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

        return this.prisma.client.$transaction(async (tx) => {
            const referral = await tx.referral.create({
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
            await this.auditTransition(tx, referral.id, physio.id, null, "SENT");
            return referral;
        });
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

        return this.prisma.client.$transaction(async (tx) => {
            const updated = await tx.referral.update({
                where: { id: referralId },
                data: { status: "PATIENT_CONSENTED", patientConsented: true, patientConsentedAt: new Date() },
            });
            await this.auditTransition(tx, referralId, patient.id, ref.status, "PATIENT_CONSENTED");
            return updated;
        });
    }

    async respond(physio: SessionUser, referralId: string, decision: "ACCEPTED" | "DECLINED", reason?: string) {
        const ref = await this.prisma.client.referral.findUnique({ where: { id: referralId } });
        if (!ref) throw new NotFoundException({ code: "NOT_FOUND", message: "Referral not found" });
        if (ref.toProfessionalId && ref.toProfessionalId !== physio.id) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not addressed to you" });
        }
        this.assertTransition(ref.status, decision);

        return this.prisma.client.$transaction(async (tx) => {
            const updated = await tx.referral.update({
                where: { id: referralId },
                data: {
                    status: decision,
                    toProfessionalId: decision === "ACCEPTED" ? physio.id : ref.toProfessionalId,
                    declineReason: decision === "DECLINED" ? (reason ?? null) : null,
                },
            });
            await this.auditTransition(tx, referralId, physio.id, ref.status, decision, reason);
            return updated;
        });
    }
}
