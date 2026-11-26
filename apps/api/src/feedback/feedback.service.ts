import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { SessionUser } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";

type SubmitFeedbackInput = {
    formType: "PATIENT_SESSION" | "SPECIALIST_SESSION" | "PATIENT_END_OF_PILOT" | "SPECIALIST_END_OF_PILOT";
    appointmentId?: string;
    painScore?: number;
    functionScore?: number;
    overallRating?: number;
    communicationRating?: number;
    whatWentWell?: string;
    whatCouldImprove?: string;
    wouldRecommend?: boolean;
};

@Injectable()
export class FeedbackService {
    constructor(private readonly prisma: PrismaService) {}

    async submit(user: SessionUser, input: SubmitFeedbackInput) {
        const isSessionForm = input.formType === "PATIENT_SESSION" || input.formType === "SPECIALIST_SESSION";

        if (isSessionForm) {
            if (!input.appointmentId) {
                throw new BadRequestException({ code: "APPOINTMENT_REQUIRED", message: "appointmentId is required for session feedback" });
            }
            const appt = await this.prisma.client.appointment.findUnique({
                where: { id: input.appointmentId },
                select: { patientId: true, physioId: true, status: true },
            });
            if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });
            if (appt.status !== "COMPLETED") {
                throw new BadRequestException({ code: "SESSION_NOT_COMPLETE", message: "Feedback can only be submitted after the session is completed" });
            }
            const isParticipant = appt.patientId === user.id || appt.physioId === user.id;
            if (!isParticipant) {
                throw new ForbiddenException({ code: "FORBIDDEN", message: "You are not a participant in this session" });
            }

            // Prevent duplicate submission
            const existing = await this.prisma.client.sessionFeedback.findFirst({
                where: { appointmentId: input.appointmentId, submittedById: user.id, formType: input.formType },
            });
            if (existing) {
                throw new BadRequestException({ code: "ALREADY_SUBMITTED", message: "You have already submitted feedback for this session" });
            }
        }

        // Validate score ranges
        const scores = [input.painScore, input.functionScore, input.overallRating, input.communicationRating];
        for (const s of scores) {
            if (s !== undefined && (s < 1 || s > 10)) {
                throw new BadRequestException({ code: "INVALID_SCORE", message: "Scores must be between 1 and 10" });
            }
        }

        return this.prisma.client.sessionFeedback.create({
            data: {
                formType: input.formType,
                appointmentId: input.appointmentId ?? null,
                submittedById: user.id,
                painScore: input.painScore ?? null,
                functionScore: input.functionScore ?? null,
                overallRating: input.overallRating ?? null,
                communicationRating: input.communicationRating ?? null,
                whatWentWell: input.whatWentWell ?? null,
                whatCouldImprove: input.whatCouldImprove ?? null,
                wouldRecommend: input.wouldRecommend ?? null,
            },
            select: { id: true, formType: true, createdAt: true },
        });
    }

    async getForAppointment(user: SessionUser, appointmentId: string) {
        const appt = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
            select: { patientId: true, physioId: true },
        });
        if (!appt) throw new NotFoundException({ code: "NOT_FOUND", message: "Appointment not found" });

        const isParticipant = appt.patientId === user.id || appt.physioId === user.id;
        if (!isParticipant && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your appointment" });
        }

        return this.prisma.client.sessionFeedback.findMany({
            where: { appointmentId },
            select: {
                id: true,
                formType: true,
                painScore: true,
                functionScore: true,
                overallRating: true,
                communicationRating: true,
                wouldRecommend: true,
                createdAt: true,
                // Free-text only returned to admins
                ...(user.role === "ADMIN" ? { whatWentWell: true, whatCouldImprove: true } : {}),
            },
            orderBy: { createdAt: "asc" },
        });
    }

    /** Admin: export all feedback as CSV rows (no patient names). */
    async exportCsv(): Promise<string> {
        const rows = await this.prisma.client.sessionFeedback.findMany({
            select: {
                id: true,
                formType: true,
                appointmentId: true,
                painScore: true,
                functionScore: true,
                overallRating: true,
                communicationRating: true,
                wouldRecommend: true,
                createdAt: true,
            },
            orderBy: { createdAt: "asc" },
        });

        const header = "id,formType,appointmentId,painScore,functionScore,overallRating,communicationRating,wouldRecommend,submittedAt";
        const lines = rows.map((r) =>
            [
                r.id,
                r.formType,
                r.appointmentId ?? "",
                r.painScore ?? "",
                r.functionScore ?? "",
                r.overallRating ?? "",
                r.communicationRating ?? "",
                r.wouldRecommend === null ? "" : r.wouldRecommend ? "true" : "false",
                r.createdAt.toISOString(),
            ].join(","),
        );

        return [header, ...lines].join("\n");
    }
}
