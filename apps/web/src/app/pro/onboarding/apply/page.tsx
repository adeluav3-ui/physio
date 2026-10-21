import Link from "next/link";
import { Card } from "@physio/ui";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import { SignOutButton } from "@/components/sign-out-button";

type Appointment = {
    id: string;
    startsAt: string;
    status: string;
    patient: { user: { name: string } };
};

export default async function PhysioDashboard() {
    const user = await requireSession(["PHYSIO"]);

    let today: Appointment[] = [];
    try {
        const appointments = await apiFetch<Appointment[]>("/booking/appointments");
        const now = new Date();
        today = appointments.filter(
            (a) =>
                a.status === "CONFIRMED" &&
                new Date(a.startsAt).toDateString() === now.toDateString(),
        );
    } catch {
        // No appointments yet; empty state.
    }

    return (
        <div className="mx-auto max-w-2xl p-4">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Today, {user.name.split(" ")[0]}</h1>
                <SignOutButton />
            </div>

            <div className="flex flex-col gap-3">
                {today.length === 0 ? (
                    <Card>
                        <p className="text-sm text-text-muted">
                            Nothing scheduled today. Check your availability to open more slots.
                        </p>
                        <Link
                            href="/pro/availability"
                            className="mt-3 inline-block text-sm font-medium text-primary-600 underline"
                        >
                            Edit availability
                        </Link>
                    </Card>
                ) : (
                    today.map((a) => (
                        <Card key={a.id}>
                            <p className="text-xs uppercase tracking-wide text-text-muted">
                                {new Date(a.startsAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                            <p className="mt-1 text-lg font-semibold">{a.patient.user.name}</p>
                            <Link
                                href={`/pro/appointments/${a.id}/prep`}
                                className="mt-3 inline-block text-sm font-medium text-primary-600 underline"
                            >
                                Open prep
                            </Link>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}