import Link from "next/link";
import { redirect } from "next/navigation";
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

    try {
        const profile = await apiFetch<{ licenceStatus: string }>(`/physios/${user.id}`);
        if (profile.licenceStatus !== "VERIFIED") {
            redirect(
                profile.licenceStatus === "REJECTED" || profile.licenceStatus === "EXPIRED"
                    ? "/pro/onboarding/apply"
                    : "/pro/onboarding/pending",
            );
        }
    } catch (err) {
        if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
            throw err;
        }
    }

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
        // Empty state.
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
                            href="/pro/appointments"
                            className="mt-3 inline-block text-sm font-medium text-primary-600 underline"
                        >
                            View all appointments
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
                                href={`/pro/session/${a.id}`}
                                className="mt-3 inline-block text-sm font-medium text-primary-600 underline"
                            >
                                Open session
                            </Link>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}