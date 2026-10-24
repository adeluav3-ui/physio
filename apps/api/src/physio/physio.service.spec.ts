import { NotFoundException } from "@nestjs/common";
import { PhysioService } from "./physio.service.js";

const FORBIDDEN_FIELDS = ["licenceNo", "licenceStatus", "email", "phone", "passwordHash", "notes"];

function makeProfile(overrides: Record<string, unknown> = {}) {
    return {
        userId: "u1",
        licenceNo: "PHYSIO-NG-001",
        licenceStatus: "VERIFIED",
        specialties: ["Sports"],
        bio: "Test physio",
        rateKobo: 1000000,
        serviceArea: "Lagos",
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: "u1", name: "Alice", email: "alice@test.com" },
        ...overrides,
    };
}

function makePrisma(profileOrNull: object | null) {
    return {
        client: {
            physioProfile: {
                findMany: jest.fn().mockResolvedValue(profileOrNull ? [profileOrNull] : []),
                findUnique: jest.fn().mockResolvedValue(profileOrNull),
            },
        },
    };
}

function buildService(prisma: any) {
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    return new PhysioService(prisma as any, audit as any);
}

describe("PhysioService public endpoints — field leakage", () => {
    it("listPublic does not return licenceNo or licenceStatus", async () => {
        const prisma = makePrisma(makeProfile());
        const svc = buildService(prisma);
        const results = await svc.listPublic();
        for (const record of results) {
            for (const field of FORBIDDEN_FIELDS) {
                expect(record).not.toHaveProperty(field);
            }
        }
    });

    it("getPublic does not return licenceNo or licenceStatus", async () => {
        const prisma = makePrisma(makeProfile());
        const svc = buildService(prisma);
        const result = await svc.getPublic("u1");
        for (const field of FORBIDDEN_FIELDS) {
            expect(result).not.toHaveProperty(field);
        }
    });

    it("getPublic throws 404 for unverified physio", async () => {
        const prisma = makePrisma(makeProfile({ licenceStatus: "UNVERIFIED" }));
        const svc = buildService(prisma);
        await expect(svc.getPublic("u1")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("getPublic throws 404 when physio does not exist", async () => {
        const prisma = makePrisma(null);
        const svc = buildService(prisma);
        await expect(svc.getPublic("u1")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("listPublic returns expected allowed fields including verified boolean", async () => {
        const prisma = makePrisma(makeProfile());
        const svc = buildService(prisma);
        const [result] = await svc.listPublic();
        expect(result).toHaveProperty("userId");
        expect(result).toHaveProperty("specialties");
        expect(result).toHaveProperty("bio");
        expect(result).toHaveProperty("rateKobo");
        expect(result).toHaveProperty("serviceArea");
        expect(result).toHaveProperty("user");
        expect(result).toHaveProperty("verified", true);
    });
});
