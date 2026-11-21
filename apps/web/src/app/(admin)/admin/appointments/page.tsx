import Link from "next/link";
import { Card } from "@physio/ui";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";

type Appointment = {
    id: string;
    startsAt: string;
    status: string;
    mode: string;
    type: string;
    patient: { user: { name: string } };
    physio: { user: { name: string } };
    payment: { status: string; amountKobo: number } | null;
};

export default async function AdminAppointmentsPage() {
    await requireSession(["ADMIN"]);

    let appointments: Appointment[] = [];
    try {
        appointments = await apiFetch<Appointment[]>("/booking/appointments");
        appointments.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    } catch {
        // empty state or endpoint not yet wired
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Appointments</h1>
            <p className="mt-1 text-sm text-text-muted">All appointments across the platform.</p>

            <Card padding="none" className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-text-muted">
                        <tr>
                            <th className="px-4 py-2">When</th>
                            <th className="px-4 py-2">Patient</th>
                            <th className="px-4 py-2">Physio</th>
                            <th className="px-4 py-2">Type / Mode</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Payment</th>
                            <th className="px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.map((a) => (
                            <tr key={a.id} className="border-t border-border">
                                <td className="px-4 py-2 text-xs">
                                    {new Date(a.startsAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-2">{a.patient.user.name}</td>
                                <td className="px-4 py-2">{a.physio.user.name}</td>
                                <td className="px-4 py-2 text-xs">
                                    {a.type} · {a.mode}
                                </td>
                                <td className="px-4 py-2">
                                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium">
                                        {a.status.replace(/_/g, " ")}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-xs">
                                    {a.payment
                                        ? `${a.payment.status} · ₦${(a.payment.amountKobo / 100).toLocaleString()}`
                                        : "—"}
                                </td>
                                <td className="px-4 py-2 flex gap-3">
                                    <Link
                                        href={`/app/appointments/${a.id}`}
                                        className="text-xs text-primary-600 underline"
                                    >
                                        View
                                    </Link>
                                    <Link
                                        href={`/admin/payments`}
                                        className="text-xs text-text-muted underline"
                                    >
                                        Ledger
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {appointments.length === 0 && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-8 text-center text-text-muted"
                                >
                                    No appointments yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
