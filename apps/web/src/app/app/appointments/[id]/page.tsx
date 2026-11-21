import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@physio/ui";
import { requireSession } from "@/lib/session";
import { apiFetch, ApiError } from "@/lib/api";
import { AutoConfirmPayment } from "../auto-confirm-payment";

type AppointmentDetail = {
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
    mode: string;
    type: string;
    physio: { user: { name: string; email: string } };
    patient: { user: { name: string } };
    payment: { status: string; amountKobo: number; providerRef: string | null } | null;
    videoSession: { roomId: string } | null;
};

const JOIN_WINDOW_MS = 15 * 60 * 1000;

function isInJoinWindow(startsAt: string, endsAt: string) {
    const now = Date.now();
    const start = new Date(startsAt).getTime();
    const end = new Date(endsAt).getTime();
    return now >= start - JOIN_WINDOW_MS && now <= end + 90 * 60 * 1000;
}

export default async function PatientAppointmentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireSession(["PATIENT"]);
    const { id } = await params;

    let appt: AppointmentDetail;
    try {
        appt = await apiFetch<AppointmentDetail>(`/booking/appointments/${id}`);
    } catch (err) {
        if (err instanceof ApiError && err.status === 404) notFound();
        throw err;
    }

    const joinable =
        (appt.status === "CONFIRMED" || appt.status === "IN_PROGRESS") &&
        isInJoinWindow(appt.startsAt, appt.endsAt);

    const pendingPayment = appt.payment?.status === "PENDING";

    return (
        <div className="mx-auto max-w-xl p-4">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold">Appointment</h1>
                <Link href="/app/appointments" className="text-sm text-text-muted underline">
                    All appointments
                </Link>
            </div>

            <Card>
                <dl className="space-y-3 text-sm">
                    <div>
                        <dt className="text-xs uppercase tracking-wide text-text-muted">Status</dt>
                        <dd className="mt-0.5 font-medium">{appt.status.replace(/_/g, " ")}</dd>
                    </div>
                    <div>
                        <dt className="text-xs uppercase tracking-wide text-text-muted">Physiotherapist</dt>
                        <dd className="mt-0.5">{appt.physio.user.name}</dd>
                    </div>
                    <div>
                        <dt className="text-xs uppercase tracking-wide text-text-muted">When</dt>
                        <dd className="mt-0.5">
                            {new Date(appt.startsAt).toLocaleString("en-NG", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "Africa/Lagos",
                            })}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs uppercase tracking-wide text-text-muted">Mode</dt>
                        <dd className="mt-0.5">{appt.mode}</dd>
                    </div>
                    {appt.payment && (
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-text-muted">Payment</dt>
                            <dd className="mt-0.5">
                                {appt.payment.status} · ₦
                                {(appt.payment.amountKobo / 100).toLocaleString()}
                            </dd>
                        </div>
                    )}
                </dl>
            </Card>

            <div className="mt-4 flex flex-col gap-3">
                {joinable && appt.mode === "VIDEO" && (
                    <Link
                        href={`/app/session/${appt.id}`}
                        className="block rounded-lg bg-primary-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-primary-700"
                    >
                        Join session
                    </Link>
                )}

                {pendingPayment && (
                    <Card>
                        <p className="text-sm font-medium text-amber-700">Payment received</p>
                        <AutoConfirmPayment appointmentId={appt.id} />
                    </Card>
                )}

                {!joinable && appt.status === "CONFIRMED" && appt.mode === "VIDEO" && (
                    <Card>
                        <p className="text-sm text-text-muted">
                            The Join session button will appear 15 minutes before your appointment.
                        </p>
                    </Card>
                )}

                {appt.status === "COMPLETED" && (
                    <Link
                        href={`/app/appointments/${appt.id}/review`}
                        className="block rounded-lg border border-border bg-white px-4 py-3 text-center text-sm font-semibold text-text-primary hover:bg-surface-muted"
                    >
                        Leave a review
                    </Link>
                )}
            </div>
        </div>
    );
}
