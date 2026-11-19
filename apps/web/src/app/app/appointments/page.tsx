import Link from "next/link";
import { Card } from "@physio/ui";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import { AutoConfirmPayment } from "./auto-confirm-payment";

type Appointment = {
    id: string;
    startsAt: string;
    status: string;
    mode: string;
    physio: { user: { name: string } };
    payment: { status: string } | null;
};

const STATUS_LABEL: Record<string, string> = {
    PENDING_PAYMENT: "Awaiting payment",
    CONFIRMED: "Confirmed",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded",
};

export default async function PatientAppointmentsPage() {
    await requireSession(["PATIENT"]);

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
                <h1 className="text-2xl font-semibold">My appointments</h1>
                <Link
                    href="/app"
                    className="text-sm text-text-muted underline"
                >
                    Back to dashboard
                </Link>
            </div>

            {appointments.length === 0 ? (
                <Card>
                    <p className="text-sm text-text-muted">No appointments yet.</p>
                    <Link
                        href="/app/intake/complaint"
                        className="mt-3 inline-block text-sm font-medium text-primary-600 underline"
                    >
                        Start intake to book
                    </Link>
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
                                            year: "numeric",
                                        })}
                                        {" · "}
                                        {new Date(a.startsAt).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                    <p className="mt-1 font-semibold">{a.physio.user.name}</p>
                                    <p className="text-sm text-text-muted">{a.mode}</p>
                                </div>
                                <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium">
                                    {STATUS_LABEL[a.status] ?? a.status}
                                </span>
                            </div>
                            <div className="mt-3">
                                <Link
                                    href={`/app/appointments/${a.id}`}
                                    className="text-sm font-medium text-primary-600 underline"
                                >
                                    View details
                                </Link>
                                {a.status === "PENDING_PAYMENT" && (
                                    <AutoConfirmPayment appointmentId={a.id} />
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
