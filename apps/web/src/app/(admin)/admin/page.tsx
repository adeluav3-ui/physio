import Link from "next/link";
import { Card } from "@physio/ui";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";

export default async function AdminOverview() {
    await requireSession(["ADMIN"]);

    let pendingPhysios = 0;
    let ledgerCount = 0;
    try {
        const [physios, ledger] = await Promise.all([
            apiFetch<unknown[]>("/physios/admin/pending"),
            apiFetch<unknown[]>("/admin/payments/ledger"),
        ]);
        pendingPhysios = physios.length;
        ledgerCount = ledger.length;
    } catch {
        // Empty state.
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Overview</h1>
            <p className="mt-1 text-sm text-text-muted">
                Administrative summary. Each section updates as activity happens.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                <Card>
                    <p className="text-xs uppercase tracking-wide text-text-muted">Professionals awaiting verification</p>
                    <p className="mt-1 text-3xl font-semibold">{pendingPhysios}</p>
                    <Link
                        href="/admin/physios"
                        className="mt-3 inline-block text-sm font-medium text-primary-600 underline"
                    >
                        Review queue
                    </Link>
                </Card>

                <Card>
                    <p className="text-xs uppercase tracking-wide text-text-muted">Ledger entries</p>
                    <p className="mt-1 text-3xl font-semibold">{ledgerCount}</p>
                    <Link
                        href="/admin/payments"
                        className="mt-3 inline-block text-sm font-medium text-primary-600 underline"
                    >
                        View ledger
                    </Link>
                </Card>

                <Card>
                    <p className="text-xs uppercase tracking-wide text-text-muted">Open incidents</p>
                    <p className="mt-1 text-3xl font-semibold">0</p>
                    <p className="mt-3 text-sm text-text-muted">No incidents logged.</p>
                </Card>
            </div>
        </div>
    );
}