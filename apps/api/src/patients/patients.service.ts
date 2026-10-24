import { ForbiddenException, Injectable } from "@nestjs/common";
import { z } from "zod";
import type { SessionUser } from "@physio/shared";
import { PrismaService } from "../prisma/prisma.service.js";

export const updatePatientSchema = z.object({
    dob: z.string().date().optional(),
    sex: z.string().max(30).optional(),
    location: z.string().max(200).optional(),
    emergencyContact: z.string().max(200).optional(),
});

@Injectable()
export class PatientsService {
    constructor(private readonly prisma: PrismaService) { }

    async getMe(user: SessionUser) {
        if (user.role !== "PATIENT") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Patient only" });
        }
        return this.prisma.client.patientProfile.findUnique({ where: { userId: user.id } });
    }

    async updateMe(user: SessionUser, input: z.infer<typeof updatePatientSchema>) {
        if (user.role !== "PATIENT") {
            throw new ForbiddenException({ code: "FORBIDDEN", message: "Patient only" });
        }

        // Build the update payload with only the fields that were provided.
        // Prisma's exactOptionalPropertyTypes rejects `undefined` for nullable fields;
        // it wants either the value present or the property omitted entirely.
        const data: {
            dob?: Date | null;
            sex?: string | null;
            location?: string | null;
            emergencyContact?: string | null;
        } = {};

        if (input.dob !== undefined) data.dob = input.dob ? new Date(input.dob) : null;
        if (input.sex !== undefined) data.sex = input.sex;
        if (input.location !== undefined) data.location = input.location;
        if (input.emergencyContact !== undefined) data.emergencyContact = input.emergencyContact;

        return this.prisma.client.patientProfile.upsert({
            where: { userId: user.id },
            create: { userId: user.id, ...data },
            update: data,
        });
    }
    async isComplete(userId: string) {
        const p = await this.prisma.client.patientProfile.findUnique({ where: { userId } });
        return Boolean(p?.dob && p?.sex && p?.location && p?.emergencyContact);
    }
}