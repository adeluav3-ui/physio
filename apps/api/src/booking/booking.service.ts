import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { BookAppointmentInput, SessionUser } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { PaymentsService } from "../payments/payments.service.js";
import { SlotService } from "./slot.service.js";
import { AuditService } from "../audit/audit.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { PatientsService } from "../patients/patients.service.js";

@Injectable()
export class BookingService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly slots: SlotService,
        private readonly payments: PaymentsService,
        private readonly audit: AuditService,
        private readonly notifications: NotificationsService,
        private readonly patients: PatientsService,
    ) { }

    async listForPatient(user: SessionUser) {
        return this.prisma.client.appointment.findMany({
            where: { patientId: user.id },
            orderBy: { startsAt: "desc" },
            include: { payment: true, physio: { include: { user: true } } },
        });
    }

    async listForPhysio(user: SessionUser, from?: Date, to?: Date) {
        return this.prisma.client.appointment.findMany({
            where: {
                physioId: user.id,
                ...(from || to
                    ? { startsAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
                    : {}),
            },
            orderBy: { startsAt: "asc" },
            include: { patient: { include: { user: true } }, payment: true },
        });
    }

    async book(user: SessionUser, input: BookAppointmentInput) {
        if (user.role !== "PATIENT") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Only patients can book" });
        }

        const startsAt = new Date(input.startsAt);
        if (Number.isNaN(startsAt.getTime())) {
            throw new BadRequestException({ code: "INVALID_DATE", message: "Invalid start time" });
        }

        // For ASSESSMENT, intake must exist, belong to user, and be GREEN/AMBER (not RED).
        if (input.type === "ASSESSMENT") {
            if (!input.intakeId) {
                throw new BadRequestException({ code: "INTAKE_REQUIRED", message: "Intake required before assessment" });
            }
            const intake = await this.prisma.client.intake.findUnique({
                where: { id: input.intakeId },
                include: { triage: true },
            });
            if (!intake || intake.patientId !== user.id) {
                throw new ForbiddenException({ code: "INVALID_INTAKE", message: "Intake not found for this patient" });
            }
            if (intake.triage?.level === "RED") {
                throw new BadRequestException({
                    code: "TRIAGE_RED",
                    message: "Online booking is not available for this case. Please seek in-person care.",
                });
            }
        }

        const physio = await this.prisma.client.physioProfile.findUnique({
            where: { userId: input.physioId },
            include: { user: true },
        });
        if (!physio) throw new NotFoundException({ code: "PHYSIO_NOT_FOUND", message: "Physio not found" });
        if (physio.licenceStatus !== "VERIFIED") {
            throw new BadRequestException({ code: "PHYSIO_NOT_VERIFIED", message: "This physio is not yet verified" });
        }

        const complete = await this.patients.isComplete(user.id);
        if (!complete) {
            throw new BadRequestException({
                code: "PROFILE_INCOMPLETE",
                message: "Please complete your profile details before booking",
            });
        }

        const bookable = await this.slots.isSlotBookable(
            input.physioId,
            startsAt,
            input.durationMinutes,
            input.mode,
        );
        if (!bookable) {
            throw new BadRequestException({ code: "SLOT_UNAVAILABLE", message: "That slot is no longer available" });
        }

        const endsAt = new Date(startsAt.getTime() + input.durationMinutes * 60_000);
        const amountKobo = physio.rateKobo;

        const reference = `appt-${randomUUID()}`;

        const { appointment, payment } = await this.prisma.client.$transaction(async (tx) => {
            const appointment = await tx.appointment.create({
                data: {
                    patientId: user.id,
                    physioId: input.physioId,
                    type: input.type,
                    mode: input.mode,
                    startsAt,
                    endsAt,
                    status: "PENDING_PAYMENT",
                    intakeId: input.type === "ASSESSMENT" ? (input.intakeId ?? null) : null,
                },
            });

            const payment = await tx.payment.create({
                data: {
                    appointmentId: appointment.id,
                    amountKobo,
                    status: "PENDING",
                    providerRef: reference,
                },
            });

            return { appointment, payment };
        });

        const appUrl = process.env.APP_URL ?? "http://localhost:3000";
        const init = await this.payments.initializeCharge({
            email: user.email,
            amountKobo,
            currency: "NGN",
            reference,
            callbackUrl: `${appUrl}/app/payments/callback`,
            metadata: { appointmentId: appointment.id },
        });

        await this.audit.record({
            actorId: user.id,
            action: "auth.login", // placeholder; booking creation is audited via payment ledger
            entity: "Appointment",
            entityId: appointment.id,
        });

        return {
            appointmentId: appointment.id,
            authorizationUrl: init.authorizationUrl,
            reference,
        };
    }

    async getById(user: SessionUser, appointmentId: string) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                payment: true,
                intake: { include: { triage: true } },
                physio: { include: { user: true } },
                patient: { include: { user: true } },
            },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });

        const isOwner = appt.patientId === user.id || appt.physioId === user.id;
        if (!isOwner && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your appointment" });
        }

        await this.audit.record({
            actorId: user.id,
            action: "record.view",
            entity: "Appointment",
            entityId: appt.id,
        });

        return appt;
    }

    /**
     * Called by the payments webhook after a successful charge.
     * Confirms the appointment, holds funds, sends notifications.
     */
    async confirmAfterPayment(appointmentId: string, providerRef: string) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
            include: { payment: true, physio: { include: { user: true } }, patient: { include: { user: true } } },
        });
        if (!appt) return;
        if (appt.status !== "PENDING_PAYMENT") return;

        await this.prisma.client.$transaction(async (tx) => {
            await tx.appointment.update({
                where: { id: appointmentId },
                data: { status: "CONFIRMED" },
            });
            await tx.payment.update({
                where: { appointmentId },
                data: { status: "HELD", providerRef },
            });
        });

        await this.payments.recordLedger({
            appointmentId,
            type: "CHARGE",
            amountKobo: appt.payment!.amountKobo,
            note: `Paystack charge ${providerRef}`,
        });
        await this.payments.recordLedger({
            appointmentId,
            type: "HOLD",
            amountKobo: -appt.payment!.amountKobo,
            note: "Held pending session completion",
        });

        await this.notifications.sendAppointmentConfirmed(appt.id);
    }
}