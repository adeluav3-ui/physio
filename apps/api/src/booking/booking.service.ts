import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { type BookAppointmentInput, type SessionUser, PATIENT_CANCEL_FREE_HOURS, FIRST_CONSULT_PRICE_KOBO, FOLLOW_UP_PRICE_KOBO } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { PaymentsService } from "../payments/payments.service.js";
import { SlotService } from "./slot.service.js";
import { SlotHoldService } from "./slot-hold.service.js";
import { AuditService } from "../audit/audit.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { PatientsService } from "../patients/patients.service.js";

@Injectable()
export class BookingService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly slots: SlotService,
        private readonly holds: SlotHoldService,
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

    async getMySpecialists(user: SessionUser) {
        if (user.role !== "PATIENT") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Patient only" });
        }

        const appointments = await this.prisma.client.appointment.findMany({
            where: {
                patientId: user.id,
                status: { in: ["CONFIRMED", "COMPLETED", "IN_PROGRESS"] },
            },
            orderBy: { startsAt: "desc" },
            distinct: ["physioId"],
            select: {
                physioId: true,
                startsAt: true,
                physio: {
                    select: {
                        userId: true,
                        discipline: true,
                        photoUrl: true,
                        sessionTypes: true,
                        user: { select: { name: true } },
                    },
                },
            },
        });

        const physioIds = appointments.map((a) => a.physioId);

        const [packages, nextSlots] = await Promise.all([
            this.prisma.client.package.findMany({
                where: { patientId: user.id, physioId: { in: physioIds }, status: "ACTIVE" },
                select: { id: true, physioId: true, size: true, remaining: true, expiresAt: true },
            }),
            Promise.all(
                physioIds.map((id) =>
                    this.slots.nextAvailable(id).then((s) => ({ physioId: id, next: s })),
                ),
            ),
        ]);

        return appointments.map((a) => ({
            physio: a.physio,
            lastVisit: a.startsAt,
            activePackage: packages.find((p) => p.physioId === a.physioId) ?? null,
            nextAvailableSlot: nextSlots.find((s) => s.physioId === a.physioId)?.next ?? null,
        }));
    }

    async listForPhysio(user: SessionUser, from?: Date, to?: Date) {
        const appts = await this.prisma.client.appointment.findMany({
            where: {
                physioId: user.id,
                ...(from || to
                    ? { startsAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
                    : {}),
            },
            orderBy: { startsAt: "asc" },
            include: { patient: { include: { user: true } }, payment: true },
        });
        if (appts.length > 0) {
            await this.audit.record({
                actorId: user.id,
                action: "record.list",
                entity: "Appointment",
                entityId: user.id,
            });
        }
        return appts;
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
        const amountKobo = input.type === "ASSESSMENT" ? FIRST_CONSULT_PRICE_KOBO : FOLLOW_UP_PRICE_KOBO;

        const reference = `appt-${randomUUID()}`;

        // Create a slot hold so the slot is blocked during checkout.
        const hold = await this.holds.createHold(input.physioId, user.id, startsAt, endsAt);

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

        // Link the hold to the appointment so the expiry job knows not to delete it
        // once confirmed. The hold stays until confirmAfterPayment() converts it.
        await this.holds.confirmHold(hold.id, appointment.id);

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
            action: "booking.create",
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

    async listAll(user: SessionUser, limit = 50, offset = 0) {
        const appts = await this.prisma.client.appointment.findMany({
            orderBy: { startsAt: "desc" },
            skip: offset,
            take: limit,
            include: {
                patient: { include: { user: true } },
                physio: { include: { user: true } },
                payment: true,
            },
        });
        if (appts.length > 0) {
            await this.audit.record({
                actorId: user.id,
                action: "record.list",
                entity: "Appointment",
                entityId: `offset=${offset}:limit=${limit}`,
            });
        }
        return appts;
    }

    /**
     * Cancel an appointment.
     * - Patient cancels ≥ PATIENT_CANCEL_FREE_HOURS before start → full refund.
     * - Patient cancels < PATIENT_CANCEL_FREE_HOURS before start → no refund.
     * - Physio cancels at any time → full refund to patient.
     */
    async cancel(user: SessionUser, appointmentId: string, reason?: string) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
            include: { payment: true },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });

        const isPatient = appt.patientId === user.id;
        const isPhysio = appt.physioId === user.id;
        if (!isPatient && !isPhysio && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your appointment" });
        }

        if (!["PENDING_PAYMENT", "CONFIRMED"].includes(appt.status)) {
            throw new BadRequestException({ code: "CANNOT_CANCEL", message: "Appointment cannot be cancelled in its current state" });
        }

        const hoursUntilStart = (appt.startsAt.getTime() - Date.now()) / 3_600_000;
        const earlyEnough = hoursUntilStart >= PATIENT_CANCEL_FREE_HOURS;
        const refund = isPhysio || user.role === "ADMIN" || earlyEnough;

        await this.prisma.client.appointment.update({
            where: { id: appointmentId },
            data: {
                status: "CANCELLED",
                cancelledAt: new Date(),
                cancelReason: reason ?? null,
            },
        });

        await this.audit.record({
            actorId: user.id,
            action: "booking.cancel",
            entity: "Appointment",
            entityId: appointmentId,
        });

        if (refund && appt.payment?.status === "HELD") {
            await this.payments.refund(appointmentId, "Cancellation refund", user.id);
        }

        return { cancelled: true, refunded: refund };
    }

    /**
     * Patient opens a dispute within DISPUTE_WINDOW_HOURS after the session.
     * Funds remain held until admin resolves.
     */
    async openDispute(user: SessionUser, appointmentId: string) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
            include: { payment: true },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });
        if (appt.patientId !== user.id) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Only the patient can open a dispute" });
        }
        if (appt.status !== "COMPLETED") {
            throw new BadRequestException({ code: "CANNOT_DISPUTE", message: "Disputes can only be raised after the session is completed" });
        }

        await this.prisma.client.appointment.update({
            where: { id: appointmentId },
            data: { disputeAt: new Date() },
        });

        await this.audit.record({
            actorId: user.id,
            action: "booking.dispute",
            entity: "Appointment",
            entityId: appointmentId,
        });

        return { disputed: true };
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