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
        pilotParticipant: boolean;
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
            pilotParticipant: p.pilotParticipant,
            user: { id: p.user.id, name: p.user.name },
        };
    }

    async listPublic(filters?: {
        discipline?: string;
        language?: string;
        mode?: string;
        maxRateKobo?: number;
        specialtyKeyword?: string;
    }) {
        type Where = NonNullable<Parameters<typeof this.prisma.client.physioProfile.findMany>[0]>["where"];
        const where: Where = {
            licenceStatus: "VERIFIED",
            acceptingPatients: true,
        };
        if (filters?.discipline) where!.discipline = filters.discipline as import("@physio/db").Discipline;
        if (filters?.maxRateKobo) where!.rateKobo = { lte: filters.maxRateKobo };
        if (filters?.language) (where as any).languages = { has: filters.language };
        if (filters?.mode) (where as any).sessionTypes = { has: filters.mode };

        const rows = await this.prisma.client.physioProfile.findMany({
            where,
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
                sessionMinutes: true,
                pilotParticipant: true,
                user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        let list = rows;

        // keyword match against specialties
        if (filters?.specialtyKeyword) {
            const kw = filters.specialtyKeyword.toLowerCase();
            list = list.sort((a, b) => {
                const aMatch = a.specialties.some((s) => s.toLowerCase().includes(kw)) ? 0 : 1;
                const bMatch = b.specialties.some((s) => s.toLowerCase().includes(kw)) ? 0 : 1;
                return aMatch - bMatch;
            });
        }

        return list.map(PhysioService.toPublic);
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
                pilotParticipant: true,
                user: { select: { id: true, name: true } },
            },
        });
        if (!p || p.licenceStatus !== "VERIFIED") {
            throw new NotFoundException({ code: "NOT_FOUND", message: "Physio not found" });
        }
        return PhysioService.toPublic(p);
    }

    async getMyApplicationStatus(user: SessionUser) {
        const p = await this.prisma.client.physioProfile.findUnique({
            where: { userId: user.id },
            select: { licenceStatus: true },
        });
        if (!p) throw new NotFoundException({ code: "NO_PROFILE", message: "No application found" });
        return p;
    }

    async apply(user: SessionUser, input: PhysioApplyInput) {
        if (user.role !== "PATIENT" && user.role !== "PHYSIO") {
            throw new ForbiddenException({
                code: "FORBIDDEN",
                message: "Only patients or physios can apply",
            });
        }

        // Prevent same account applying twice
        const existing = await this.prisma.client.physioProfile.findUnique({
            where: { userId: user.id },
        });
        if (existing) {
            throw new BadRequestException({
                code: "ALREADY_APPLIED",
                message: "You already have an application",
            });
        }

        // Prevent same licence number being registered under a different account
        const duplicateLicence = await this.prisma.client.physioProfile.findFirst({
            where: { licenceNo: input.licenceNo },
        });
        if (duplicateLicence) {
            throw new BadRequestException({
                code: "DUPLICATE_LICENCE",
                message: "This licence number is already registered. If this is your licence, contact support.",
            });
        }

        // Prevent same NIN being registered under a different account
        const duplicateNin = await this.prisma.client.physioProfile.findFirst({
            where: { ninNumber: input.ninNumber },
        });
        if (duplicateNin) {
            throw new BadRequestException({
                code: "DUPLICATE_NIN",
                message: "This NIN is already registered. If this is your NIN, contact support.",
            });
        }

        const profile = await this.prisma.client.$transaction(async (tx) => {
            // Ensure the user has PHYSIO role — covers accounts created before the
            // isPro signup flag was introduced (old PATIENT-role accounts).
            if (user.role !== "PHYSIO") {
                await tx.user.update({ where: { id: user.id }, data: { role: "PHYSIO" } });
            }
            return tx.physioProfile.create({
                data: {
                    userId: user.id,
                    discipline: input.discipline,
                    licenceNo: input.licenceNo,
                    licenceDocUrl: input.licenceDocUrl,
                    certificateUrl: input.certificateUrl,
                    idType: input.idType,
                    ninNumber: input.ninNumber,
                    ninDocUrl: input.ninDocUrl,
                    photoUrl: input.photoUrl,
                    specialties: input.specialties,
                    bio: input.bio,
                    rateKobo: 0,
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

    async findPendingById(userId: string) {
        const profile = await this.prisma.client.physioProfile.findUnique({
            where: { userId },
            include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
        });
        if (!profile || profile.licenceStatus !== "UNVERIFIED") {
            throw new NotFoundException({ code: "NOT_FOUND", message: "Pending application not found" });
        }
        return profile;
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

    async updateProfile(
        user: SessionUser,
        input: {
            bio?: string;
            specialties?: string[];
            languages?: string[];
            serviceArea?: string;
            photoUrl?: string;
            sessionTypes?: string[];
        },
    ) {
        if (user.role !== "PHYSIO") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Physio only" });
        }
        return this.prisma.client.physioProfile.update({
            where: { userId: user.id },
            data: {
                ...(input.bio !== undefined && { bio: input.bio }),
                ...(input.specialties !== undefined && { specialties: input.specialties }),
                ...(input.languages !== undefined && { languages: input.languages }),
                ...(input.serviceArea !== undefined && { serviceArea: input.serviceArea }),
                ...(input.photoUrl !== undefined && { photoUrl: input.photoUrl ?? null }),
                ...(input.sessionTypes !== undefined && { sessionTypes: input.sessionTypes }),
            },
            select: {
                userId: true, bio: true, specialties: true, languages: true,
                serviceArea: true, photoUrl: true, sessionTypes: true,
            },
        });
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

    async verify(
        admin: SessionUser,
        userId: string,
        decision: "VERIFIED" | "REJECTED",
        reason?: string,
        mrtbChecked?: boolean,
    ) {
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
                    rejectedAt: decision === "REJECTED" ? new Date() : null,
                    rejectionReason: decision === "REJECTED" ? (reason ?? null) : null,
                    ...(decision === "VERIFIED" && mrtbChecked ? { mrtbCheckedAt: new Date() } : {}),
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