import { Card } from "@physio/ui";
import { apiFetch } from "@/lib/api";
import { requireSession } from "@/lib/session";

type LedgerEntry = {
    id: string;
    type: string;
    amountKobo: number;
    balanceAfterKobo: number;
    note: string | null;
    createdAt: string;
    appointment: {
        patient: { user: { name: string } };
        physio: { user: { name: string } };
    };
};

export default async function AdminPaymentsPage() {
    await requireSession(["ADMIN"]);
    const entries = await apiFetch<LedgerEntry[]>("/admin/payments/ledger");

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Payments ledger</h1>
            <p className="mt-1 text-sm text-text-muted">
                Every naira in and out. Entries are immutable; corrections appear as new rows.
            </p>

            <Card padding="none" className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-text-muted">
                        <tr>
                            <th className="px-4 py-2">When</th>
                            <th className="px-4 py-2">Type</th>
                            <th className="px-4 py-2">Patient → Physio</th>
                            <th className="px-4 py-2 text-right">Amount</th>
                            <th className="px-4 py-2 text-right">Balance</th>
                            <th className="px-4 py-2">Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((e) => (
                            <tr key={e.id} className="border-t border-border">
                                <td className="px-4 py-2">{new Date(e.createdAt).toLocaleString()}</td>
                                <td className="px-4 py-2 font-medium">{e.type}</td>
                                <td className="px-4 py-2">
                                    {e.appointment.patient.user.name} → {e.appointment.physio.user.name}
                                </td>
                                <td className="px-4 py-2 text-right">₦{(e.amountKobo / 100).toLocaleString()}</td>
                                <td className="px-4 py-2 text-right">₦{(e.balanceAfterKobo / 100).toLocaleString()}</td>
                                <td className="px-4 py-2 text-text-muted">{e.note ?? "—"}</td>
                            </tr>
                        ))}
                        {entries.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                                    No ledger entries yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}