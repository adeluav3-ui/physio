import Link from "next/link";
import { Card } from "@physio/ui";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import { SignOutButton } from "@/components/sign-out-button";

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

    let profileComplete = true;
    try {
        const profile = await apiFetch<{ dob?: string; sex?: string; location?: string; emergencyContact?: string }>("/patients/me");
        profileComplete = Boolean(profile?.dob && profile?.sex && profile?.location && profile?.emergencyContact);
    } catch { }

    return (
        <div className="mx-auto max-w-2xl p-4">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Welcome, {user.name.split(" ")[0]}</h1>
                <SignOutButton />
            </div>

            <div className="flex flex-col gap-3">

                {!profileComplete && (
                    <Card>
                        <p className="text-sm font-semibold">Complete your profile</p>
                        <p className="mt-1 text-sm text-text-muted">
                            We need a few details before your first booking.
                        </p>
                        <Link
                            href="/app/profile"
                            className="mt-3 inline-block text-sm font-medium text-primary-600 underline"
                        >
                            Complete profile
                        </Link>
                    </Card>
                )}
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
                    <p className="text-sm font-semibold">My plan</p>
                    <p className="mt-1 text-sm text-text-muted">
                        View your exercise programme and goal plans assigned by your professional.
                    </p>
                    <Link
                        href="/app/plan"
                        className="mt-3 inline-block text-sm font-medium text-primary-600 underline"
                    >
                        Open plan
                    </Link>
                </Card>

                <Card>
                    <p className="text-sm font-semibold">Find a professional</p>
                    <p className="mt-1 text-sm text-text-muted">
                        Browse verified physiotherapists, OTs, speech therapists and more.
                    </p>
                    <Link
                        href="/app/physios"
                        className="mt-3 inline-block text-sm font-medium text-primary-600 underline"
                    >
                        Browse professionals
                    </Link>
                </Card>
            </div>
        </div>
    );
}