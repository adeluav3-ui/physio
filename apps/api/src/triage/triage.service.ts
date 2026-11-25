import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import type { IntakeSubmitInput, SessionUser, TriageLevel } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import { evaluate } from "./triage.engine.js";
import { RULES_VERSION } from "./rules.js";

@Injectable()
export class TriageService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
    ) { }

    async submitIntake(user: SessionUser, input: IntakeSubmitInput) {
        if (user.role !== "PATIENT") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Only patients can submit intake" });
        }

        const redFlagRecord = Object.fromEntries(
            input.redFlagAnswers.map((a) => [a.questionId, a.answer]),
        );

        const decision = evaluate({
            painScore: input.painScore,
            redFlagAnswers: redFlagRecord,
        });

        const result = await this.prisma.client.$transaction(async (tx) => {
            const intake = await tx.intake.create({
                data: {
                    patientId: user.id,
                    complaint: input.complaint,
                    bodyRegion: input.bodyRegion,
                    onset: input.onset,
                    painScore: input.painScore,
                    history: input.history ?? null,
                    medications: input.medications ?? null,
                    redFlagAnswers: input.redFlagAnswers,
                },
            });

            const triage = await tx.triageResult.create({
                data: {
                    intakeId: intake.id,
                    level: decision.level,
                    reasons: decision.reasons,
                    ruleIds: [...decision.ruleIds, `rules_version:${RULES_VERSION}`],
                },
            });

            // Automatically open a fallback case so the admin team can follow up
            // with patients who cannot be served online.
            if (decision.level === "IN_PERSON_REQUIRED") {
                await tx.fallbackCase.create({
                    data: { intakeId: intake.id, patientId: user.id },
                });
            }

            return { intake, triage };
        });

        await this.audit.record({
            actorId: user.id,
            action: "triage.decision",
            entity: "TriageResult",
            entityId: result.triage.id,
        });

        return {
            intakeId: result.intake.id,
            triage: {
                id: result.triage.id,
                level: result.triage.level,
                reasons: result.triage.reasons,
                ruleIds: result.triage.ruleIds,
            },
        };
    }

    /**
     * Only admin can override. Downgrading a RED requires a documented reason.
     */
    async override(admin: SessionUser, intakeId: string, level: TriageLevel, reason: string) {
        if (admin.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Only admin can override triage" });
        }

        const existing = await this.prisma.client.triageResult.findUnique({
            where: { intakeId },
        });
        if (!existing) {
            throw new BadRequestException({ code: "NOT_FOUND", message: "Triage result not found" });
        }

        const updated = await this.prisma.client.triageResult.update({
            where: { intakeId },
            data: {
                level,
                reasons: [...existing.reasons, `Admin override: ${reason}`],
                overriddenBy: admin.id,
            },
        });

        await this.audit.record({
            actorId: admin.id,
            action: "triage.override",
            entity: "TriageResult",
            entityId: updated.id,
        });

        return updated;
    }

    async getLatestIntake(patient: SessionUser) {
        const intake = await this.prisma.client.intake.findFirst({
            where: { patientId: patient.id },
            orderBy: { createdAt: "desc" },
            include: { triage: true },
        });

        if (intake) {
            await this.audit.record({
                actorId: patient.id,
                action: "record.view",
                entity: "Intake",
                entityId: intake.id,
            });
        }

        return intake ?? null;
    }

    async getByIntake(actor: SessionUser, intakeId: string) {
        const intake = await this.prisma.client.intake.findUnique({
            where: { id: intakeId },
            include: { triage: true },
        });
        if (!intake) {
            throw new BadRequestException({ code: "NOT_FOUND", message: "Intake not found" });
        }

        if (actor.role === "PATIENT" && intake.patientId !== actor.id) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your intake" });
        }

        // Physios may only read triage for intakes linked to their appointments.
        if (actor.role === "PHYSIO") {
            const linked = await this.prisma.client.appointment.findFirst({
                where: { physioId: actor.id, intakeId },
            });
            if (!linked) {
                throw new ForbiddenException({
                    code: "FORBIDDEN",
                    message: "This intake is not linked to one of your appointments",
                });
            }
        }

        await this.audit.record({
            actorId: actor.id,
            action: "record.view",
            entity: "Intake",
            entityId: intake.id,
        });

        return intake;
    }
}