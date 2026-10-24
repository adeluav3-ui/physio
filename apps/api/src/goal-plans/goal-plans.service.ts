import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { SessionUser } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class GoalPlansService {
    constructor(private readonly prisma: PrismaService) {}

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
