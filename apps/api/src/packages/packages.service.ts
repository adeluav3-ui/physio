import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { SessionUser } from "@physio/shared";
import {
    PACKAGE_SIZES,
    PACKAGE_EXPIRY_DAYS,
    FOLLOW_UP_PRICE_KOBO,
} from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";

@Injectable()
export class PackagesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
        private readonly events: EventEmitter2,
    ) {}

    async purchase(user: SessionUser, physioId: string, size: 3 | 5 | 10) {
        if (user.role !== "PATIENT") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Patient only" });
        }
        if (!(PACKAGE_SIZES as readonly number[]).includes(size)) {
            throw new BadRequestException({
                code: "INVALID_PACKAGE_SIZE",
                message: `Package size must be one of ${PACKAGE_SIZES.join(", ")}`,
            });
        }

        const physio = await this.prisma.client.physioProfile.findUnique({
            where: { userId: physioId },
        });
        if (!physio || physio.licenceStatus !== "VERIFIED") {
            throw new NotFoundException({ code: "NOT_FOUND", message: "Physio not found or not verified" });
        }

        const priceKobo = size * FOLLOW_UP_PRICE_KOBO;
        const expiresAt = new Date(Date.now() + PACKAGE_EXPIRY_DAYS * 24 * 3600 * 1000);

        const pkg = await this.prisma.client.package.create({
            data: {
                patientId: user.id,
                physioId,
                size,
                remaining: size,
                priceKobo,
                status: "ACTIVE",
                expiresAt,
            },
        });

        this.events.emit("package.purchased", {
            packageId: pkg.id,
            patientId: user.id,
            physioId,
            size,
            priceKobo,
        });

        await this.audit.record({
            actorId: user.id,
            action: "record.update",
            entity: "Package",
            entityId: pkg.id,
        });

        return pkg;
    }

    async listMine(user: SessionUser) {
        const where =
            user.role === "PATIENT"
                ? { patientId: user.id }
                : { physioId: user.id };

        return this.prisma.client.package.findMany({
            where,
            include: {
                physio: { include: { user: { select: { name: true } } } },
                patient: { include: { user: { select: { name: true } } } },
            },
            orderBy: { purchasedAt: "desc" },
        });
    }

    async getOne(user: SessionUser, packageId: string) {
        const pkg = await this.prisma.client.package.findUnique({
            where: { id: packageId },
            include: {
                sessions: {
                    include: {
                        appointment: { select: { startsAt: true, status: true } },
                    },
                },
            },
        });
        if (!pkg) throw new NotFoundException({ code: "NOT_FOUND", message: "Package not found" });

        const isPatient = pkg.patientId === user.id;
        const isPhysio = pkg.physioId === user.id;
        if (!isPatient && !isPhysio && user.role !== "ADMIN") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your package" });
        }

        await this.audit.record({
            actorId: user.id,
            action: "record.view",
            entity: "Package",
            entityId: pkg.id,
        });

        return pkg;
    }

    async redeem(user: SessionUser, packageId: string, appointmentId: string) {
        if (user.role !== "PHYSIO") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Physio only" });
        }

        const pkg = await this.prisma.client.package.findUnique({
            where: { id: packageId },
        });
        if (!pkg) throw new NotFoundException({ code: "NOT_FOUND", message: "Package not found" });
        if (pkg.physioId !== user.id) {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your package" });
        }
        if (pkg.status !== "ACTIVE") {
            throw new BadRequestException({ code: "PACKAGE_NOT_ACTIVE", message: "Package is not active" });
        }
        if (pkg.remaining <= 0) {
            throw new BadRequestException({ code: "PACKAGE_EXHAUSTED", message: "Package exhausted" });
        }

        const now = new Date();
        if (pkg.expiresAt <= now) {
            // Mark as expired and report
            await this.prisma.client.package.update({
                where: { id: packageId },
                data: { status: "EXPIRED" },
            });
            throw new BadRequestException({ code: "PACKAGE_EXPIRED", message: "Package expired" });
        }

        const appointment = await this.prisma.client.appointment.findUnique({
            where: { id: appointmentId },
        });
        if (
            !appointment ||
            appointment.patientId !== pkg.patientId ||
            appointment.physioId !== pkg.physioId
        ) {
            throw new BadRequestException({
                code: "APPOINTMENT_MISMATCH",
                message: "Appointment does not belong to this patient/physio pair",
            });
        }
        if (appointment.status !== "CONFIRMED" && appointment.status !== "IN_PROGRESS") {
            throw new BadRequestException({
                code: "APPOINTMENT_NOT_ELIGIBLE",
                message: "Appointment must be CONFIRMED or IN_PROGRESS to redeem a package session",
            });
        }

        const newRemaining = pkg.remaining - 1;
        const newStatus = newRemaining === 0 ? "EXHAUSTED" : "ACTIVE";

        const session = await this.prisma.client.$transaction(async (tx) => {
            const pkgSession = await tx.packageSession.create({
                data: {
                    packageId,
                    appointmentId,
                },
            });
            await tx.package.update({
                where: { id: packageId },
                data: {
                    remaining: newRemaining,
                    status: newStatus,
                },
            });
            return pkgSession;
        });

        await this.audit.record({
            actorId: user.id,
            action: "record.update",
            entity: "Package",
            entityId: packageId,
        });

        return session;
    }

    async expireStale(): Promise<void> {
        const now = new Date();
        await this.prisma.client.package.updateMany({
            where: {
                status: "ACTIVE",
                expiresAt: { lt: now },
            },
            data: { status: "EXPIRED" },
        });
    }
}
