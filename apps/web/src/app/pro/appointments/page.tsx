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
};

const STATUS_LABEL: Record<string, string> = {
    PENDING_PAYMENT: "Awaiting payment",
    CONFIRMED: "Confirmed",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded",
};

export default async function PhysioAppointmentsPage() {
    await requireSession(["PHYSIO"]);

    let appointments: Appointment[] = [];
    try {
        appointments = await apiFetch<Appointment[]>("/booking/appointments");
        appointments.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    } catch {
        // show empty state
    }

    return (
        <div className="mx-auto max-w-2xl p-4">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Appointments</h1>
                <Link href="/pro" className="text-sm text-text-muted underline">
                    Dashboard
                </Link>
            </div>

            {appointments.length === 0 ? (
                <Card>
                    <p className="text-sm text-text-muted">No appointments yet.</p>
                </Card>
            ) : (
                <div className="flex flex-col gap-3">
                    {appointments.map((a) => (
                        <Card key={a.id}>
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-text-muted">
                                        {new Date(a.startsAt).toLocaleDateString(undefined, {
                                            weekday: "short",
                                            day: "numeric",
                                            month: "short",
                                        })}
                                        {" · "}
                                        {new Date(a.startsAt).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                    <p className="mt-1 font-semibold">{a.patient.user.name}</p>
                                    <p className="text-sm text-text-muted">
                                        {a.type} · {a.mode}
                                    </p>
                                </div>
                                <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium">
                                    {STATUS_LABEL[a.status] ?? a.status}
                                </span>
                            </div>
                            {(a.status === "CONFIRMED" || a.status === "IN_PROGRESS") && (
                                <Link
                                    href={`/pro/session/${a.id}`}
                                    className="mt-3 inline-block text-sm font-medium text-primary-600 underline"
                                >
                                    Open session
                                </Link>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
