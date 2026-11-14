import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { SessionUser } from "@physio/shared";
import { MIN_REVIEWS_TO_SHOW_RATING } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { z } from "zod";

export const submitReviewSchema = z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional(),
});
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

@Injectable()
export class ReviewsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly events: EventEmitter2,
    ) {}

    async submit(user: SessionUser, appointmentId: string, input: SubmitReviewInput) {
        if (user.role !== "PATIENT") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Patient only" });
        }

        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });
        if (appt.patientId !== user.id) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your appointment" });
        }
        if (appt.status !== "COMPLETED") {
            throw new BadRequestException({ code: "NOT_COMPLETED", message: "Session must be completed before reviewing" });
        }

        const review = await this.prisma.client.review.upsert({
            where: { appointmentId },
            create: { appointmentId, rating: input.rating, comment: input.comment ?? null },
            update: { rating: input.rating, comment: input.comment ?? null },
        });

        this.events.emit("review.created", {
            reviewId: review.id,
            appointmentId,
            physioId: appt.physioId,
            patientId: appt.patientId,
            rating: input.rating,
        });

        return review;
    }

    async getForAppointment(user: SessionUser, appointmentId: string) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });
        if (appt.patientId !== user.id && appt.physioId !== user.id && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your appointment" });
        }

        return this.prisma.client.review.findUnique({ where: { appointmentId } });
    }

    async listForPhysio(physioId: string) {
        const reviews = await this.prisma.client.review.findMany({
            where: { appointment: { physioId } },
            include: {
                appointment: {
                    select: { startsAt: true, patient: { select: { user: { select: { name: true } } } } },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const count = reviews.length;
        const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : null;
        const showRating = count >= MIN_REVIEWS_TO_SHOW_RATING;

        return {
            reviews,
            count,
            averageRating: showRating && avg !== null ? Math.round(avg * 10) / 10 : null,
        };
    }
}
