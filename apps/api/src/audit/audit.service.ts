import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

export type AuditAction =
    | "record.view"
    | "record.update"
    | "record.list"
    | "auth.login"
    | "auth.logout"
    | "auth.signup"
    | "auth.verify"
    | "triage.decision"
    | "triage.override"
    | "payment.release"
    | "payment.refund"
    | "physio.verify"
    | "physio.reject"
    | "session.start"
    | "session.end"
    | "booking.create"
    | "booking.cancel"
    | "booking.dispute"
    | "note.sign"
    | "note.addendum";

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Fire-and-forget audit write. Never let an audit failure break a request —
     * log it loudly instead. (If audits are critical, swap for a queue later.)
     */
    async record(input: {
        actorId?: string | null;
        action: AuditAction;
        entity: string;
        entityId: string;
    }) {
        try {
            await this.prisma.client.auditLog.create({
                data: {
                    actorId: input.actorId ?? null,
                    action: input.action,
                    entity: input.entity,
                    entityId: input.entityId,
                },
            });
        } catch (err) {
            this.logger.error(`Audit write failed: ${(err as Error).message}`);
        }
    }
}