/**
 * One-time backfill: find every CONFIRMED appointment whose session window
 * has fully passed (endsAt + 90 min grace) and refund the payment to the
 * patient's wallet.
 *
 * Run once:
 *   cd packages/db && npx tsx prisma/backfill-missed-sessions.ts
 */
import { PrismaClient } from "../generated/client/client.js";
import { randomUUID } from "node:crypto";

const SESSION_HARD_END_MIN = 90;

const prisma = new PrismaClient();

async function main() {
    const cutoff = new Date(Date.now() - SESSION_HARD_END_MIN * 60_000);

    const missed = await prisma.appointment.findMany({
        where: { status: "CONFIRMED", endsAt: { lt: cutoff } },
        include: { payment: true },
    });

    if (missed.length === 0) {
        console.log("No missed sessions found — nothing to backfill.");
        return;
    }

    console.log(`Found ${missed.length} missed appointment(s). Backfilling…`);

    let done = 0;
    let skipped = 0;

    for (const appt of missed) {
        const payment = appt.payment;

        if (!payment) {
            console.log(`  SKIP ${appt.id} — no payment record`);
            skipped++;
            continue;
        }
        if (payment.status === "REFUNDED") {
            console.log(`  SKIP ${appt.id} — already refunded`);
            skipped++;
            continue;
        }

        await prisma.$transaction(async (tx) => {
            // Mark payment and appointment REFUNDED.
            await tx.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
            await tx.appointment.update({ where: { id: appt.id }, data: { status: "REFUNDED" } });

            // Compute running ledger balance.
            const lastEntry = await tx.ledgerEntry.findFirst({
                where: { appointmentId: appt.id },
                orderBy: { createdAt: "desc" },
            });
            const lastBalance = lastEntry?.balanceAfterKobo ?? 0;

            // Append immutable ledger refund entry.
            await tx.ledgerEntry.create({
                data: {
                    paymentId: payment.id,
                    appointmentId: appt.id,
                    type: "REFUND",
                    amountKobo: -payment.amountKobo,
                    balanceAfterKobo: lastBalance - payment.amountKobo,
                    note: "No-show backfill: session missed by both parties",
                },
            });

            // Credit patient wallet.
            await tx.walletEntry.create({
                data: {
                    id: randomUUID(),
                    patientId: appt.patientId,
                    amountKobo: payment.amountKobo,
                    type: "REFUND_CREDIT",
                    ref: appt.id,
                    note: "Refund credited to wallet (missed session)",
                },
            });
        });

        console.log(
            `  OK   ${appt.id} — ₦${(payment.amountKobo / 100).toLocaleString("en-NG")} credited to patient ${appt.patientId}`,
        );
        done++;
    }

    console.log(`\nDone. Refunded: ${done}, Skipped: ${skipped}`);
}

main()
    .catch((err) => { console.error(err); process.exit(1); })
    .finally(() => prisma.$disconnect());
