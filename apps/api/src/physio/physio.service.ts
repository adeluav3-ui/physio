import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import type { PhysioApplyInput, SessionUser } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";

@Injectable()
export class PhysioService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
    ) { }

    async listPublic() {
        return this.prisma.client.physioProfile.findMany({
            where: { licenceStatus: "VERIFIED" },
            include: { user: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
        });
    }

    async getPublic(userId: string) {
        const p = await this.prisma.client.physioProfile.findUnique({
            where: { userId },
            include: { user: { select: { id: true, name: true, email: true } } },
        });
        if (!p) throw new NotFoundException({ code: "NOT_FOUND", message: "Physio not found" });
        return p;
    }

    async apply(user: SessionUser, input: PhysioApplyInput) {
        if (user.role !== "PATIENT" && user.role !== "PHYSIO") {
            throw new ForbiddenException({
                code: "FORBIDDEN",
                message: "Only patients or physios can apply",
            });
        }

        const existing = await this.prisma.client.physioProfile.findUnique({
            where: { userId: user.id },
        });
        if (existing) {
            throw new BadRequestException({
                code: "ALREADY_APPLIED",
                message: "You already have an application",
            });
        }

        const profile = await this.prisma.client.$transaction(async (tx) => {
            // If a patient is applying (legacy path), upgrade their role.
            // A physio signing up already has role PHYSIO, so no update needed.
            if (user.role === "PATIENT") {
                await tx.user.update({
                    where: { id: user.id },
                    data: { role: "PHYSIO" },
                });
            }

            return tx.physioProfile.create({
                data: {
                    userId: user.id,
                    licenceNo: input.licenceNo,
                    specialties: input.specialties,
                    bio: input.bio,
                    rateKobo: input.rate,
                    serviceArea: input.serviceArea,
                    licenceStatus: "UNVERIFIED",
                },
            });
        });

        await this.audit.record({
            actorId: user.id,
            action: "physio.verify",
            entity: "PhysioProfile",
            entityId: profile.userId,
        });

        return profile;
    }

    async listPending() {
        return this.prisma.client.physioProfile.findMany({
            where: { licenceStatus: "UNVERIFIED" },
            include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
            orderBy: { createdAt: "asc" },
        });
    }

    async listAll() {
        return this.prisma.client.physioProfile.findMany({
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "desc" },
        });
    }

    async verify(admin: SessionUser, userId: string, decision: "VERIFIED" | "REJECTED", reason?: string) {
        if (admin.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Admin only" });
        }

        const profile = await this.prisma.client.physioProfile.findUnique({ where: { userId } });
        if (!profile) throw new NotFoundException({ code: "NOT_FOUND", message: "Physio not found" });

        const updated = await this.prisma.client.physioProfile.update({
            where: { userId },
            data: {
                licenceStatus: decision,
                verifiedAt: decision === "VERIFIED" ? new Date() : null,
            },
        });

        await this.audit.record({
            actorId: admin.id,
            action: decision === "VERIFIED" ? "physio.verify" : "physio.reject",
            entity: "PhysioProfile",
            entityId: userId,
        });

        return { ...updated, reason: reason ?? null };
    }
}