import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { hasRedFlagWords } from "@physio/shared";
import type { SessionUser } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";

@Injectable()
export class MessagingService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
        private readonly events: EventEmitter2,
    ) { }

    private async assertThreadAccess(user: SessionUser, threadId: string) {
        const thread = await this.prisma.client.thread.findUnique({ where: { id: threadId } });
        if (!thread) throw new NotFoundException({ code: "NOT_FOUND", message: "Thread not found" });
        if (thread.patientId !== user.id && thread.physioId !== user.id && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your thread" });
        }
        return thread;
    }

    async getOrCreateThread(user: SessionUser, otherUserId: string) {
        const patientId = user.role === "PATIENT" ? user.id : otherUserId;
        const physioId = user.role === "PHYSIO" ? user.id : otherUserId;

        // Verify the other party exists and the relationship makes sense
        const existing = await this.prisma.client.thread.findUnique({
            where: { patientId_physioId: { patientId, physioId } },
            include: {
                messages: { orderBy: { sentAt: "asc" }, take: 1 },
            },
        });
        if (existing) return existing;

        const thread = await this.prisma.client.thread.create({
            data: { patientId, physioId },
        });
        return thread;
    }

    async listThreads(user: SessionUser) {
        const threads = await this.prisma.client.thread.findMany({
            where:
                user.role === "PATIENT"
                    ? { patientId: user.id }
                    : user.role === "PHYSIO"
                      ? { physioId: user.id }
                      : {},
            include: {
                patient: { select: { name: true } },
                physio: { select: { name: true } },
                messages: {
                    orderBy: { sentAt: "desc" },
                    take: 1,
                    select: { body: true, sentAt: true, senderId: true },
                },
            },
            orderBy: { updatedAt: "desc" },
        });
        return threads;
    }

    async listMessages(user: SessionUser, threadId: string) {
        await this.assertThreadAccess(user, threadId);
        const messages = await this.prisma.client.message.findMany({
            where: { threadId },
            include: { sender: { select: { name: true, role: true } } },
            orderBy: { sentAt: "asc" },
        });

        await this.audit.record({
            actorId: user.id,
            action: "record.view",
            entity: "Thread",
            entityId: threadId,
        });

        return messages;
    }

    async sendMessage(user: SessionUser, threadId: string, body: string) {
        const thread = await this.assertThreadAccess(user, threadId);

        const message = await this.prisma.client.message.create({
            data: { threadId, senderId: user.id, body },
            include: { sender: { select: { name: true, role: true } } },
        });

        await this.prisma.client.thread.update({
            where: { id: threadId },
            data: { updatedAt: new Date() },
        });

        const isPatientSender = user.role === "PATIENT";

        // Red-flag detection: only on patient messages
        if (isPatientSender && hasRedFlagWords(body)) {
            this.events.emit("message.red-flag", {
                threadId,
                messageId: message.id,
                patientId: thread.patientId,
                physioId: thread.physioId,
                body,
            });
        }

        this.events.emit("message.sent", {
            threadId,
            messageId: message.id,
            senderId: user.id,
            recipientId: isPatientSender ? thread.physioId : thread.patientId,
            isPatientSender,
        });

        return {
            ...message,
            hasRedFlag: isPatientSender && hasRedFlagWords(body),
        };
    }
}
