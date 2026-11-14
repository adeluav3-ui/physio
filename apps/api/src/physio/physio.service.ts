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

    private static toPublic(p: {
        userId: string;
        discipline: string;
        specialties: string[];
        bio: string;
        rateKobo: number;
        serviceArea: string;
        verifiedAt: Date | null;
        photoUrl: string | null;
        languages: string[];
        sessionTypes: string[];
        user: { id: string; name: string };
    }) {
        return {
            userId: p.userId,
            discipline: p.discipline,
            specialties: p.specialties,
            bio: p.bio,
            rateKobo: p.rateKobo,
            serviceArea: p.serviceArea,
            verified: p.verifiedAt !== null,
            photoUrl: p.photoUrl,
            languages: p.languages,
            sessionTypes: p.sessionTypes,
            user: { id: p.user.id, name: p.user.name },
        };
    }

    async listPublic() {
        const rows = await this.prisma.client.physioProfile.findMany({
            where: { licenceStatus: "VERIFIED" },
            select: {
                userId: true,
                discipline: true,
                specialties: true,
                bio: true,
                rateKobo: true,
                serviceArea: true,
                verifiedAt: true,
                photoUrl: true,
                languages: true,
                sessionTypes: true,
                user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return rows.map(PhysioService.toPublic);
    }

    async getPublic(userId: string) {
        const p = await this.prisma.client.physioProfile.findUnique({
            where: { userId },
            select: {
                userId: true,
                licenceStatus: true,
                discipline: true,
                specialties: true,
                bio: true,
                rateKobo: true,
                serviceArea: true,
                verifiedAt: true,
                photoUrl: true,
                languages: true,
                sessionTypes: true,
                user: { select: { id: true, name: true } },
            },
        });
        if (!p || p.licenceStatus !== "VERIFIED") {
            throw new NotFoundException({ code: "NOT_FOUND", message: "Physio not found" });
        }
        return PhysioService.toPublic(p);
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
            return tx.physioProfile.create({
                data: {
                    userId: user.id,
                    discipline: input.discipline,
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

    async getMe(user: SessionUser) {
        const p = await this.prisma.client.physioProfile.findUnique({
            where: { userId: user.id },
            select: {
                userId: true,
                licenceStatus: true,
                discipline: true,
                specialties: true,
                bio: true,
                rateKobo: true,
                serviceArea: true,
                verifiedAt: true,
                photoUrl: true,
                languages: true,
                sessionTypes: true,
                sessionMinutes: true,
                bufferMinutes: true,
                acceptingPatients: true,
                user: { select: { id: true, name: true } },
            },
        });
        if (!p) throw new NotFoundException({ code: "NOT_FOUND", message: "Profile not found" });
        return p;
    }

    async updateSettings(
        user: SessionUser,
        input: {
            sessionMinutes?: number;
            bufferMinutes?: number;
            acceptingPatients?: boolean;
            sessionTypes?: string[];
        },
    ) {
        if (user.role !== "PHYSIO") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Physio only" });
        }
        return this.prisma.client.physioProfile.update({
            where: { userId: user.id },
            data: {
                ...(input.sessionMinutes !== undefined && { sessionMinutes: input.sessionMinutes }),
                ...(input.bufferMinutes !== undefined && { bufferMinutes: input.bufferMinutes }),
                ...(input.acceptingPatients !== undefined && { acceptingPatients: input.acceptingPatients }),
                ...(input.sessionTypes !== undefined && { sessionTypes: input.sessionTypes }),
            },
            select: {
                sessionMinutes: true,
                bufferMinutes: true,
                acceptingPatients: true,
                sessionTypes: true,
            },
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

        const updated = await this.prisma.client.$transaction(async (tx) => {
            if (decision === "VERIFIED") {
                await tx.user.update({ where: { id: userId }, data: { role: "PHYSIO" } });
            }
            return tx.physioProfile.update({
                where: { userId },
                data: {
                    licenceStatus: decision,
                    verifiedAt: decision === "VERIFIED" ? new Date() : null,
                },
            });
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