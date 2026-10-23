import { ConflictException } from "@nestjs/common";
import { AuthService } from "./auth.service.js";

function makeMailService() {
    return { sendEmailVerification: jest.fn().mockResolvedValue(undefined) };
}

function makeTokenService() {
    return { create: jest.fn().mockResolvedValue("tok-abc") };
}

function makePrisma(opts: { userExists?: boolean } = {}) {
    return {
        client: {
            user: {
                findUnique: jest.fn().mockResolvedValue(opts.userExists ? { id: "u1" } : null),
                create: jest.fn().mockResolvedValue({
                    id: "u1",
                    email: "a@test.com",
                    name: "Alice",
                    role: "PATIENT",
                }),
            },
        },
    };
}

function buildService(prisma: any) {
    const jwt = { signAsync: jest.fn() };
    const tokens = makeTokenService();
    const mail = makeMailService();
    return new AuthService(prisma as any, jwt as any, tokens as any, mail as any);
}

describe("AuthService.signUp role hardening", () => {
    it("always creates a PATIENT account regardless of input", async () => {
        const prisma = makePrisma();
        const svc = buildService(prisma);
        await svc.signUp({ email: "a@test.com", password: "Password1!", name: "Alice" });
        const createCall = prisma.client.user.create.mock.calls[0][0];
        expect(createCall.data.role).toBe("PATIENT");
    });

    it("always creates a patientProfile", async () => {
        const prisma = makePrisma();
        const svc = buildService(prisma);
        await svc.signUp({ email: "a@test.com", password: "Password1!", name: "Alice" });
        const createCall = prisma.client.user.create.mock.calls[0][0];
        expect(createCall.data.patientProfile).toEqual({ create: {} });
    });

    it("service does not read role from input — PHYSIO in input still creates PATIENT", async () => {
        const prisma = makePrisma();
        const svc = buildService(prisma);
        // Even if a caller somehow constructs the input object with a role field,
        // the service must ignore it and hardcode PATIENT.
        const input = { email: "a@test.com", password: "Password1!", name: "Alice" };
        await svc.signUp(input);
        const createCall = prisma.client.user.create.mock.calls[0][0];
        expect(createCall.data.role).toBe("PATIENT");
    });

    it("service never creates an ADMIN account via signUp", async () => {
        const prisma = makePrisma();
        const svc = buildService(prisma);
        await svc.signUp({ email: "a@test.com", password: "Password1!", name: "Alice" });
        const createCall = prisma.client.user.create.mock.calls[0][0];
        expect(createCall.data.role).not.toBe("ADMIN");
        expect(createCall.data.role).not.toBe("PHYSIO");
    });

    it("throws ConflictException when email is already taken", async () => {
        const prisma = makePrisma({ userExists: true });
        const svc = buildService(prisma);
        await expect(
            svc.signUp({ email: "a@test.com", password: "Password1!", name: "Alice" }),
        ).rejects.toBeInstanceOf(ConflictException);
    });

    it("sends a verification email after signup", async () => {
        const prisma = makePrisma();
        const jwt = { signAsync: jest.fn() };
        const tokens = makeTokenService();
        const mail = makeMailService();
        const svc = new AuthService(prisma as any, jwt as any, tokens as any, mail as any);
        await svc.signUp({ email: "a@test.com", password: "Password1!", name: "Alice" });
        expect(mail.sendEmailVerification).toHaveBeenCalledWith("a@test.com", "Alice", "tok-abc");
    });
});
