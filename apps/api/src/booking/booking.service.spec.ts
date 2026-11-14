import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { BookingService } from "./booking.service.js";
import type { BookAppointmentInput, SessionUser } from "@physio/shared";

const PHYSIO_USER_ID = "physio-user-001";
const PATIENT_USER_ID = "patient-user-001";
const INTAKE_GREEN_ID = "intake-green-001";
const INTAKE_RED_ID = "intake-red-001";

const patientUser: SessionUser = {
    id: PATIENT_USER_ID,
    email: "p@test.com",
    name: "Test Patient",
    role: "PATIENT",
    emailVerified: true,
    status: "ACTIVE",
};

function makeSlot(dt: Date): Date {
    return new Date(dt.getTime() + 24 * 60 * 60 * 1000); // tomorrow
}

function makeInput(overrides: Partial<BookAppointmentInput> = {}): BookAppointmentInput {
    return {
        physioId: PHYSIO_USER_ID,
        intakeId: INTAKE_GREEN_ID,
        type: "ASSESSMENT",
        mode: "VIDEO",
        startsAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        durationMinutes: 45,
        ...overrides,
    };
}

function makePrisma(opts: {
    intakeTriage?: string | null;
    physioExists?: boolean;
    slotTaken?: boolean;
    patientProfileComplete?: boolean;
}) {
    return {
        client: {
            intake: {
                findUnique: jest.fn().mockResolvedValue(
                    opts.intakeTriage !== undefined
                        ? {
                            id: opts.intakeTriage === "RED" ? INTAKE_RED_ID : INTAKE_GREEN_ID,
                            patientId: PATIENT_USER_ID,
                            triage: opts.intakeTriage ? { level: opts.intakeTriage } : null,
                        }
                        : null,
                ),
            },
            physioProfile: {
                findUnique: jest.fn().mockResolvedValue(
                    opts.physioExists !== false
                        ? {
                            userId: PHYSIO_USER_ID,
                            rateKobo: 1_000_000,
                            licenceStatus: "VERIFIED",
                            user: { id: PHYSIO_USER_ID, email: "physio@test.com", name: "Dr Test" },
                          }
                        : null,
                ),
            },
            appointment: {
                findFirst: jest.fn().mockResolvedValue(opts.slotTaken ? { id: "existing" } : null),
                create: jest.fn().mockResolvedValue({ id: "new-appt" }),
            },
            patientProfile: {
                findUnique: jest.fn().mockResolvedValue(
                    opts.patientProfileComplete !== false
                        ? { dob: "1990-01-01", sex: "Male", location: "Lagos", emergencyContact: "Jane" }
                        : null,
                ),
            },
            payment: {
                create: jest.fn().mockResolvedValue({ id: "pay-001" }),
            },
            $transaction: jest.fn().mockImplementation((fn: any) =>
                fn({
                    appointment: { create: jest.fn().mockResolvedValue({ id: "new-appt" }) },
                    payment: { create: jest.fn().mockResolvedValue({ id: "pay-001" }) },
                }),
            ),
        },
    };
}

describe("BookingService booking guards", () => {
    function buildService(prisma: any) {
        const slots = { isSlotBookable: jest.fn().mockResolvedValue(true) };
        const payments = { initializeCharge: jest.fn().mockResolvedValue({ reference: "ref-1", authorizationUrl: "https://pay.test", accessCode: "ac" }) };
        const audit = { record: jest.fn().mockResolvedValue(undefined) };
        const notifications = { sendAppointmentConfirmed: jest.fn().mockResolvedValue(undefined) };
        const patients = { isComplete: jest.fn().mockResolvedValue(true) };
        const holds = { createHold: jest.fn().mockResolvedValue({ id: "hold-1" }), confirmHold: jest.fn().mockResolvedValue(undefined) };
        return new BookingService(prisma, slots as any, holds as any, payments as any, audit as any, notifications as any, patients as any);
    }

    it("throws TRIAGE_RED when intake has level RED", async () => {
        const prisma = makePrisma({ intakeTriage: "RED" });
        const svc = buildService(prisma);
        await expect(svc.book(patientUser, makeInput({ intakeId: INTAKE_RED_ID }))).rejects.toMatchObject({
            response: expect.objectContaining({ code: "TRIAGE_RED" }),
        });
    });

    it("allows GREEN triage to proceed (no throw)", async () => {
        const prisma = makePrisma({ intakeTriage: "GREEN" });
        const svc = buildService(prisma);
        await expect(svc.book(patientUser, makeInput())).resolves.toBeDefined();
    });

    it("allows AMBER triage to proceed (online booking OK)", async () => {
        const prisma = makePrisma({ intakeTriage: "AMBER" });
        const svc = buildService(prisma);
        await expect(svc.book(patientUser, makeInput())).resolves.toBeDefined();
    });

    it("throws FORBIDDEN when caller is not PATIENT role", async () => {
        const prisma = makePrisma({ intakeTriage: "GREEN" });
        const svc = buildService(prisma);
        const physioUser: SessionUser = { ...patientUser, role: "PHYSIO" };
        await expect(svc.book(physioUser, makeInput())).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("throws SLOT_UNAVAILABLE when slot is already taken", async () => {
        const prisma = makePrisma({ intakeTriage: "GREEN", slotTaken: true });
        const slots = { isSlotBookable: jest.fn().mockResolvedValue(false) };
        const payments = { initializeCharge: jest.fn() };
        const audit = { record: jest.fn() };
        const notifications = { sendAppointmentConfirmed: jest.fn() };
        const patients = { isComplete: jest.fn().mockResolvedValue(true) };
        const holds = { createHold: jest.fn().mockResolvedValue({ id: "hold-1" }), confirmHold: jest.fn().mockResolvedValue(undefined) };
        const svc = new BookingService(prisma as any, slots as any, holds as any, payments as any, audit as any, notifications as any, patients as any);
        await expect(svc.book(patientUser, makeInput())).rejects.toMatchObject({
            response: expect.objectContaining({ code: "SLOT_UNAVAILABLE" }),
        });
    });

    it("throws INTAKE_REQUIRED when booking ASSESSMENT without intakeId", async () => {
        const prisma = makePrisma({ intakeTriage: "GREEN" });
        const svc = buildService(prisma);
        await expect(svc.book(patientUser, makeInput({ intakeId: undefined }))).rejects.toMatchObject({
            response: expect.objectContaining({ code: "INTAKE_REQUIRED" }),
        });
    });
});

const adminUser: SessionUser = {
    id: "admin-001",
    email: "admin@test.com",
    name: "Admin",
    role: "ADMIN",
    emailVerified: true,
    status: "ACTIVE",
};

describe("BookingService audit logging", () => {
    const APPT_ID = "appt-audit-001";

    function makeAuditPrisma() {
        return {
            client: {
                appointment: {
                    findUnique: jest.fn().mockResolvedValue({
                        id: APPT_ID,
                        patientId: PATIENT_USER_ID,
                        physioId: PHYSIO_USER_ID,
                        status: "CONFIRMED",
                        payment: null,
                        intake: null,
                        physio: null,
                        patient: null,
                    }),
                    findMany: jest.fn().mockResolvedValue([{ id: APPT_ID }]),
                },
            },
        };
    }

    function buildAuditService(prisma: any) {
        const audit = { record: jest.fn().mockResolvedValue(undefined) };
        const slots = { isSlotBookable: jest.fn() };
        const holds = { createHold: jest.fn().mockResolvedValue({ id: "hold-1" }), confirmHold: jest.fn().mockResolvedValue(undefined) };
        const payments = { initializeCharge: jest.fn() };
        const notifications = { sendAppointmentConfirmed: jest.fn() };
        const patients = { isComplete: jest.fn() };
        const svc = new BookingService(prisma, slots as any, holds as any, payments as any, audit as any, notifications as any, patients as any);
        return { svc, audit };
    }

    it("getById writes record.view audit entry for appointment owner", async () => {
        const prisma = makeAuditPrisma();
        const { svc, audit } = buildAuditService(prisma);
        await svc.getById(patientUser, APPT_ID);
        expect(audit.record).toHaveBeenCalledWith(
            expect.objectContaining({ action: "record.view", entity: "Appointment", entityId: APPT_ID }),
        );
    });

    it("listAll writes record.list audit entry for admin", async () => {
        const prisma = makeAuditPrisma();
        const { svc, audit } = buildAuditService(prisma);
        await svc.listAll(adminUser);
        expect(audit.record).toHaveBeenCalledWith(
            expect.objectContaining({ action: "record.list", entity: "Appointment", actorId: adminUser.id }),
        );
    });

    it("listAll does not write audit when result is empty", async () => {
        const prisma = makeAuditPrisma();
        prisma.client.appointment.findMany.mockResolvedValue([]);
        const { svc, audit } = buildAuditService(prisma);
        await svc.listAll(adminUser);
        expect(audit.record).not.toHaveBeenCalled();
    });
});
