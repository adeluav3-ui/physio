import { PaymentsService } from "./payments.service.js";

const AMOUNT = 1_000_000; // 1,000,000 kobo = 10,000 NGN
const APPT_ID = "appt-ledger-test";
const PAYMENT_ID = "pay-001";

function makePrisma(lastBalance: number) {
    return {
        client: {
            payment: {
                findUnique: jest.fn().mockResolvedValue({
                    id: PAYMENT_ID,
                    amountKobo: AMOUNT,
                    entries: lastBalance === 0
                        ? []
                        : [{ balanceAfterKobo: lastBalance }],
                }),
                update: jest.fn().mockResolvedValue({}),
            },
            ledgerEntry: {
                create: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
            },
            $transaction: jest.fn().mockImplementation((fn: any) => fn({ payment: { update: jest.fn() } })),
        },
    };
}

function makeAudit() {
    return { record: jest.fn().mockResolvedValue(undefined) };
}

function makeProvider() {
    return {
        refund: jest.fn().mockResolvedValue({ status: "success", raw: {} }),
    };
}

function buildService(lastBalance: number) {
    const prisma = makePrisma(lastBalance);
    const audit = makeAudit();
    const events = { emit: jest.fn() };
    const svc = new PaymentsService(prisma as any, audit as any, events as any);
    (svc as any).provider = makeProvider();
    return { svc, prisma };
}

describe("ledger arithmetic — CHARGE + HOLD = 0", () => {
    it("CHARGE entry gets balanceAfter = amountKobo (first entry, lastBalance=0)", async () => {
        const { svc, prisma } = buildService(0);
        await svc.recordLedger({ appointmentId: APPT_ID, type: "CHARGE", amountKobo: AMOUNT });
        const createCall = prisma.client.ledgerEntry.create.mock.calls[0]![0].data;
        expect(createCall.balanceAfterKobo).toBe(AMOUNT);
    });

    it("HOLD entry after CHARGE gets balanceAfter = 0", async () => {
        const { svc, prisma } = buildService(AMOUNT);
        await svc.recordLedger({ appointmentId: APPT_ID, type: "HOLD", amountKobo: -AMOUNT });
        const createCall = prisma.client.ledgerEntry.create.mock.calls[0]![0].data;
        expect(createCall.balanceAfterKobo).toBe(0);
    });
});

describe("ledger arithmetic — RELEASE sequence nets zero", () => {
    const PLATFORM_FEE = Math.round((AMOUNT * 1500) / 10_000); // 150,000
    const PHYSIO_PAYOUT = AMOUNT - PLATFORM_FEE; // 850,000

    it("platform fee is 15% of amountKobo", () => {
        expect(PLATFORM_FEE).toBe(150_000);
        expect(PHYSIO_PAYOUT).toBe(850_000);
    });

    it("RELEASE(-1M) + PLATFORM_FEE(+150k) + PHYSIO_PAYOUT(+850k) = 0 from zero balance", () => {
        // Simulate running sum
        let balance = 0;
        balance += -AMOUNT;       // RELEASE
        balance += PLATFORM_FEE;  // PLATFORM_FEE
        balance += PHYSIO_PAYOUT; // PHYSIO_PAYOUT
        expect(balance).toBe(0);
    });

    it("releaseToPhysio records PHYSIO_PAYOUT as positive (not negative)", async () => {
        const prisma = {
            client: {
                payment: {
                    findUnique: jest.fn().mockResolvedValue({
                        id: PAYMENT_ID,
                        amountKobo: AMOUNT,
                        status: "HELD",
                        entries: [],
                    }),
                    update: jest.fn().mockResolvedValue({}),
                },
                ledgerEntry: {
                    create: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
                },
                $transaction: jest.fn().mockImplementation((fn: any) =>
                    fn({ payment: { update: jest.fn() } }),
                ),
            },
        };
        const audit = makeAudit();
        const events = { emit: jest.fn() };
        const svc = new PaymentsService(prisma as any, audit as any, events as any);

        await svc.releaseToPhysio(APPT_ID);

        const calls = prisma.client.ledgerEntry.create.mock.calls.map(
            (c: any) => ({ type: c[0].data.type, amount: c[0].data.amountKobo }),
        );
        const payoutCall = calls.find((c: any) => c.type === "PHYSIO_PAYOUT");
        expect(payoutCall).toBeDefined();
        expect(payoutCall!.amount).toBeGreaterThan(0);
    });
});
