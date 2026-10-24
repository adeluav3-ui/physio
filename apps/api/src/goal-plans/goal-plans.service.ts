import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { z } from "zod";
import type { SessionUser } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";

export const goalPlanCreateSchema = z.object({
    patientId: z.string().uuid(),
    title: z.string().min(2).max(200),
    goals: z.array(z.object({
        title: z.string().min(2).max(200),
        notes: z.string().max(1000).optional(),
        tasks: z.array(z.object({
            title: z.string().min(2).max(200),
            schedule: z.string().min(1).max(100),
            notes: z.string().max(500).optional(),
        })).max(20).default([]),
    })).min(1).max(20),
});
export type GoalPlanCreateInput = z.infer<typeof goalPlanCreateSchema>;

@Injectable()
export class GoalPlansService {
    constructor(private readonly prisma: PrismaService) {}

    async createForPatient(physio: SessionUser, input: GoalPlanCreateInput) {
        const appointment = await this.prisma.client.appointment.findFirst({
            where: { physioId: physio.id, patientId: input.patientId },
        });
        if (!appointment) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "No appointment with this patient" });
        }

        return this.prisma.client.goalPlan.create({
            data: {
                patientId: input.patientId,
                professionalId: physio.id,
                title: input.title,
                goals: {
                    create: input.goals.map((g) => ({
                        title: g.title,
                        notes: g.notes ?? null,
                        tasks: { create: g.tasks.map((t) => ({ title: t.title, schedule: t.schedule, notes: t.notes ?? null })) },
                    })),
                },
            },
            include: { goals: { include: { tasks: true } } },
        });
    }

    async listForPatient(user: SessionUser) {
        return this.prisma.client.goalPlan.findMany({
            where: { patientId: user.id },
            include: {
                goals: {
                    include: { tasks: { include: { logs: { orderBy: { date: "desc" }, take: 7 } } } },
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async logTask(user: SessionUser, taskId: string, completed: boolean, note?: string) {
        const task = await this.prisma.client.practiceTask.findUnique({
            where: { id: taskId },
            include: { goal: { include: { goalPlan: true } } },
        });
        if (!task) throw new NotFoundException({ code: "NOT_FOUND", message: "Task not found" });
        if (task.goal.goalPlan.patientId !== user.id) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your task" });
        }

        const today = new Date().toISOString().slice(0, 10);
        return this.prisma.client.taskLog.upsert({
            where: { practiceTaskId_date: { practiceTaskId: taskId, date: new Date(today) } },
            create: { practiceTaskId: taskId, date: new Date(today), completed, note: note ?? null },
            update: { completed, note: note ?? null },
        });
    }
}
