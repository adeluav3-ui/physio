import { Test } from "@nestjs/testing";
import { NotificationsService } from "./notifications.service.js";
import { MailService } from "../mail/mail.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

const APPT_ID = "appt-test-001";

const mockAppointment = {
    id: APPT_ID,
    startsAt: new Date("2026-11-01T09:00:00.000Z"),
    endsAt: new Date("2026-11-01T09:45:00.000Z"),
    mode: "VIDEO",
    patient: { user: { email: "patient@example.com", name: "Ada Obi" } },
    physio: { user: { email: "physio@example.com", name: "Dr Emeka" } },
};

describe("NotificationsService", () => {
    let service: NotificationsService;
    let mailService: { sendRaw: jest.Mock; sendWithIcs: jest.Mock };
    let prismaService: { client: { appointment: { findUnique: jest.Mock } } };

    beforeEach(async () => {
        mailService = {
            sendRaw: jest.fn().mockResolvedValue(undefined),
            sendWithIcs: jest.fn().mockResolvedValue(undefined),
        };
        prismaService = {
            client: {
                appointment: { findUnique: jest.fn().mockResolvedValue(mockAppointment) },
            },
        };

        const module = await Test.createTestingModule({
            providers: [
                NotificationsService,
                { provide: MailService, useValue: mailService },
                { provide: PrismaService, useValue: prismaService },
            ],
        }).compile();

        service = module.get(NotificationsService);
    });

    it("sends confirmed email to both patient and physio", async () => {
        await service.sendAppointmentConfirmed(APPT_ID);

        expect(mailService.sendWithIcs).toHaveBeenCalledTimes(2);

        const [patientTo] = mailService.sendWithIcs.mock.calls[0]!;
        const [physioTo] = mailService.sendWithIcs.mock.calls[1]!;

        expect(patientTo).toBe("patient@example.com");
        expect(physioTo).toBe("physio@example.com");
    });

    it("includes physio name in patient email body", async () => {
        await service.sendAppointmentConfirmed(APPT_ID);

        const [, , html, text] = mailService.sendWithIcs.mock.calls[0]!;
        expect(html).toContain("Dr Emeka");
        expect(text).toContain("Dr Emeka");
    });

    it("includes patient name in physio email body", async () => {
        await service.sendAppointmentConfirmed(APPT_ID);

        const [, , html, text] = mailService.sendWithIcs.mock.calls[1]!;
        expect(html).toContain("Ada Obi");
        expect(text).toContain("Ada Obi");
    });

    it("includes appointment ID in join link for VIDEO mode", async () => {
        await service.sendAppointmentConfirmed(APPT_ID);

        const [, , html, text] = mailService.sendWithIcs.mock.calls[0]!;
        expect(html).toContain(APPT_ID);
        expect(text).toContain(APPT_ID);
    });

    it("skips emails when appointment not found", async () => {
        prismaService.client.appointment.findUnique.mockResolvedValue(null);

        await service.sendAppointmentConfirmed("nonexistent");

        expect(mailService.sendWithIcs).not.toHaveBeenCalled();
    });

    it("gracefully skips when MailService.sendWithIcs is disabled (placeholder key)", async () => {
        mailService.sendWithIcs.mockResolvedValue(undefined);

        await expect(service.sendAppointmentConfirmed(APPT_ID)).resolves.not.toThrow();
        expect(mailService.sendWithIcs).toHaveBeenCalledTimes(2);
    });
});
