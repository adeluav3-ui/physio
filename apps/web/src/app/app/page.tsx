import Link from "next/link";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import { SignOutButton } from "@/components/sign-out-button";

type Appointment = {
    id: string;
    startsAt: string;
    status: string;
    physio: { user: { name: string } };
};

type TodaySummary = { doneToday: number; total: number; streak: number };

const NAV = "#022449";
const GREEN = "#1b7d0e";
const MUTED = "#4f6478";
const BORDER = "#d9e3ec";

export default async function PatientDashboard() {
    const user = await requireSession(["PATIENT"]);

    let nextAppointment: Appointment | null = null;
    let profileComplete = true;
    let today: TodaySummary = { doneToday: 0, total: 0, streak: 0 };

    try {
        const [appointments, profile, todayData] = await Promise.allSettled([
            apiFetch<Appointment[]>("/booking/appointments"),
            apiFetch<{ dob?: string; sex?: string; location?: string; emergencyContact?: string }>("/patients/me"),
            apiFetch<TodaySummary>("/programs/today"),
        ]);

        if (appointments.status === "fulfilled") {
            nextAppointment = appointments.value
                .filter((a) => a.status === "CONFIRMED" && new Date(a.startsAt) > new Date())
                .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null;
        }
        if (profile.status === "fulfilled") {
            const p = profile.value;
            profileComplete = Boolean(p?.dob && p?.sex && p?.location && p?.emergencyContact);
        }
        if (todayData.status === "fulfilled") {
            today = todayData.value ?? today;
        }
    } catch { }

    const firstName = user.name.split(" ")[0];
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const pct = today.total > 0 ? Math.round((today.doneToday / today.total) * 100) : 0;

    return (
        <div style={{ padding: "24px 20px", fontFamily: "'Figtree', system-ui, sans-serif", color: NAV, maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ font: "500 14px 'Figtree', sans-serif", color: MUTED }}>{greeting}</div>
                    <h1 style={{ font: "700 26px 'Figtree', sans-serif", margin: 0 }}>Your day</h1>
                </div>
                <SignOutButton />
            </div>

            {/* Profile incomplete nudge */}
            {!profileComplete && (
                <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16 }}>
                    <p style={{ font: "600 15px 'Figtree', sans-serif", margin: 0 }}>Complete your profile</p>
                    <p style={{ font: "400 14px 'Figtree', sans-serif", color: MUTED, margin: "4px 0 12px" }}>
                        We need a few details before your first booking.
                    </p>
                    <Link href="/app/profile" style={{ font: "600 14px 'Figtree', sans-serif", color: GREEN }}>
                        Complete profile
                    </Link>
                </div>
            )}

            {/* Next session card */}
            {nextAppointment ? (
                <div style={{ background: NAV, border: `1px solid ${NAV}`, borderRadius: 16, padding: 16, color: "#fff" }}>
                    <div style={{ font: "600 13px 'Figtree', sans-serif", color: "#9fc1e0" }}>Next session</div>
                    <div style={{ font: "700 20px 'Figtree', sans-serif", marginTop: 4 }}>
                        {new Date(nextAppointment.startsAt).toLocaleString("en-NG", {
                            weekday: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </div>
                    <div style={{ font: "400 15px 'Figtree', sans-serif", marginTop: 2, color: "#c9d9ec" }}>
                        with {nextAppointment.physio.user.name}
                    </div>
                    <Link
                        href={`/app/appointments/${nextAppointment.id}`}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 46, borderRadius: 12, background: "#fff", color: NAV, font: "600 16px 'Figtree', sans-serif", textDecoration: "none", marginTop: 14 }}
                    >
                        View appointment
                    </Link>
                </div>
            ) : (
                <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16 }}>
                    <p style={{ font: "400 15px 'Figtree', sans-serif", color: MUTED, margin: 0 }}>
                        No upcoming appointments.
                    </p>
                    <Link href="/app/intake/complaint" style={{ display: "block", marginTop: 12, font: "600 14px 'Figtree', sans-serif", color: GREEN }}>
                        Start intake
                    </Link>
                </div>
            )}

            {/* Today's tasks */}
            {today.total > 0 && (
                <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2 style={{ font: "700 17px 'Figtree', sans-serif", margin: 0 }}>Today's tasks</h2>
                        <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 99, font: "600 12px 'Figtree', sans-serif", background: "#e3f1f6", color: "#07506b" }}>
                            {today.doneToday} of {today.total} done
                        </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: "#d9e3ec", marginTop: 12 }}>
                        <div style={{ width: `${pct}%`, height: 8, borderRadius: 99, background: GREEN }} />
                    </div>
                    <Link href="/app/plan" style={{ display: "block", marginTop: 12, font: "600 14px 'Figtree', sans-serif", color: GREEN }}>
                        Open exercises
                    </Link>
                </div>
            )}

            {today.total === 0 && (
                <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16 }}>
                    <p style={{ font: "600 15px 'Figtree', sans-serif", margin: 0 }}>My plan</p>
                    <p style={{ font: "400 14px 'Figtree', sans-serif", color: MUTED, margin: "4px 0 12px" }}>
                        View your exercise programme assigned by your professional.
                    </p>
                    <Link href="/app/plan" style={{ font: "600 14px 'Figtree', sans-serif", color: GREEN }}>
                        Open plan
                    </Link>
                </div>
            )}

            {/* Streak */}
            {today.streak > 0 && (
                <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16 }}>
                    <div style={{ font: "500 13px 'Figtree', sans-serif", color: MUTED }}>Streak</div>
                    <div style={{ font: "700 22px 'Figtree', sans-serif", marginTop: 2 }}>
                        {today.streak} day{today.streak === 1 ? "" : "s"} in a row
                    </div>
                </div>
            )}

            {/* Find a professional */}
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16 }}>
                <p style={{ font: "600 15px 'Figtree', sans-serif", margin: 0 }}>Find a professional</p>
                <p style={{ font: "400 14px 'Figtree', sans-serif", color: MUTED, margin: "4px 0 12px" }}>
                    Browse verified physiotherapists, OTs, speech therapists and more.
                </p>
                <Link href="/app/physios" style={{ font: "600 14px 'Figtree', sans-serif", color: GREEN }}>
                    Browse professionals
                </Link>
            </div>
        </div>
    );
}
