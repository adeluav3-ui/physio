import Link from "next/link";
import { Card } from "@physio/ui";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";

type Appointment = {
    id: string;
    startsAt: string;
    status: string;
    physio: { user: { name: string } };
};

export default async function PatientDashboard() {
    const user = await requireSession(["PATIENT"]);

    let nextAppointment: Appointment | null = null;
    try {
        const appointments = await apiFetch<Appointment[]>("/booking/appointments");
        nextAppointment =
            appointments
                .filter((a) => a.status === "CONFIRMED" && new Date(a.startsAt) > new Date())
                .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null;
    } catch {
        // No appointments yet or API not reachable; show empty state.
    }

    return (
        <div className="mx-auto max-w-2xl p-4">
            <h1 className="text-2xl font-semibold">Welcome, {user.name.split(" ")[0]}</h1>

            <div className="mt-6 flex flex-col gap-3">
                {nextAppointment ? (
                    <Card>
                        <p className="text-xs uppercase tracking-wide text-text-muted">Next appointment</p>
                        <p className="mt-1 text-lg font-semibold">
                            {new Date(nextAppointment.startsAt).toLocaleString()}
                        </p>
                        <p className="mt-1 text-sm text-text-muted">
                            with {nextAppointment.physio.user.name}
                        </p>
                        <Link
                            href={`/app/appointments/${nextAppointment.id}`}
                            className="mt-3 inline-block text-sm font-medium text-primary-600 underline"
                        >
                            View appointment
                        </Link>
                    </Card>
                ) : (
                    <Card>
                        <p className="text-sm text-text-muted">
                            No upcoming appointments. Complete your intake to get started.
                        </p>
                        <Link
                            href="/app/intake/complaint"
                            className="mt-3 inline-block text-sm font-medium text-primary-600 underline"
                        >
                            Start intake
                        </Link>
                    </Card>
                )}

                <Card>
                    <p className="text-sm font-semibold">Today's program</p>
                    <p className="mt-1 text-sm text-text-muted">
                        Your physio hasn't assigned a program yet. You'll see it here after your first session.
                    </p>
                </Card>

                <Card>
                    <p className="text-sm font-semibold">Messages</p>
                    <p className="mt-1 text-sm text-text-muted">
                        No messages yet. You can message your physio after your first session.
                    </p>
                </Card>
            </div>
        </div>
    );
}