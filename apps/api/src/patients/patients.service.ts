import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { z } from "zod";
import type { SessionUser } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";

export const updatePatientSchema = z.object({
    dob: z.string().date().optional(),
    sex: z.string().max(30).optional(),
    location: z.string().max(200).optional(),
    emergencyContact: z.string().max(200).optional(),
});

@Injectable()
export class PatientsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
    ) { }

    async getMe(user: SessionUser) {
        if (user.role !== "PATIENT") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Patient only" });
        }
        return this.prisma.client.patientProfile.findUnique({ where: { userId: user.id } });
    }

    async updateMe(user: SessionUser, input: z.infer<typeof updatePatientSchema>) {
        if (user.role !== "PATIENT") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Patient only" });
        }

        // Build the update payload with only the fields that were provided.
        // Prisma's exactOptionalPropertyTypes rejects `undefined` for nullable fields;
        // it wants either the value present or the property omitted entirely.
        const data: {
            dob?: Date | null;
            sex?: string | null;
            location?: string | null;
            emergencyContact?: string | null;
        } = {};

        if (input.dob !== undefined) data.dob = input.dob ? new Date(input.dob) : null;
        if (input.sex !== undefined) data.sex = input.sex;
        if (input.location !== undefined) data.location = input.location;
        if (input.emergencyContact !== undefined) data.emergencyContact = input.emergencyContact;

        return this.prisma.client.patientProfile.upsert({
            where: { userId: user.id },
            create: { userId: user.id, ...data },
            update: data,
        });
    }
    async isComplete(userId: string) {
        const p = await this.prisma.client.patientProfile.findUnique({ where: { userId } });
        return Boolean(p?.dob && p?.sex && p?.location && p?.emergencyContact);
    }

    /**
     * Returns a patient's full chart for a physio who has an appointment with them.
     * Includes profile, latest intake, triage result, and appointment history.
     * Writes an audit log per NDPA requirements.
     */
    async getChartForPhysio(physio: SessionUser, patientId: string) {
        // Verify the physio has at least one appointment with this patient
        const hasRelationship = await this.prisma.client.appointment.count({
            where: { physioId: physio.id, patientId },
        });
        if (!hasRelationship) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "No appointment relationship with this patient" });
        }

        const [profile, latestIntake, appointments, referrals] = await Promise.all([
            this.prisma.client.user.findUnique({
                where: { id: patientId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    patientProfile: { select: { dob: true, sex: true, location: true, emergencyContact: true } },
                },
            }),
            this.prisma.client.intake.findFirst({
                where: { patientId },
                orderBy: { createdAt: "desc" },
                include: { triage: true },
            }),
            this.prisma.client.appointment.findMany({
                where: { physioId: physio.id, patientId },
                orderBy: { startsAt: "desc" },
                select: {
                    id: true, startsAt: true, endsAt: true, status: true, mode: true, type: true,
                    notes: {
                        select: {
                            id: true, subjective: true, objective: true, assessment: true,
                            plan: true, signedAt: true, createdAt: true,
                            addenda: { select: { id: true, body: true, addedAt: true } },
                        },
                    },
                    patientSummary: { select: { id: true, body: true, approvedAt: true } },
                },
            }),
            this.prisma.client.referral.findMany({
                where: { patientId, fromProfessionalId: physio.id },
                orderBy: { id: "desc" },
                select: {
                    id: true, toDiscipline: true, reason: true, urgency: true, status: true,
                    summary: true, declineReason: true,
                    receiver: { select: { user: { select: { name: true } } } },
                },
            }),
        ]);

        if (!profile) {
            throw new NotFoundException({ code: "NOT_FOUND", message: "Patient not found" });
        }

        await this.audit.record({
            actorId: physio.id,
            action: "record.view",
            entity: "PatientChart",
            entityId: patientId,
        });

        return { profile, latestIntake, appointments, referrals };
    }
}