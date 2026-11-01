import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";

type Appointment = {
    id: string; startsAt: string; status: string;
    patient: { user: { name: string } };
    mode?: string; type?: string; patientId?: string;
};

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

export default async function ProHome() {
    const user = await requireSession(["PHYSIO"]);

    try {
        const profile = await apiFetch<{ licenceStatus: string }>("/physios/me");
        if (profile.licenceStatus !== "VERIFIED") {
            redirect(
                profile.licenceStatus === "REJECTED" || profile.licenceStatus === "EXPIRED"
                    ? "/pro/onboarding/apply"
                    : "/pro/onboarding/pending",
            );
        }
    } catch (err) {
        if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err;
        // No application found — send to onboarding
        redirect("/pro/onboarding/apply");
    }

    let today: Appointment[] = [];
    let nextAppt: Appointment | null = null;
    try {
        const appointments = await apiFetch<Appointment[]>("/booking/appointments");
        const now = new Date();
        today = appointments
            .filter(a => a.status === "CONFIRMED" && new Date(a.startsAt).toDateString() === now.toDateString())
            .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
        nextAppt = appointments
            .filter(a => a.status === "CONFIRMED" && new Date(a.startsAt) > now)
            .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null;
    } catch { /* empty */ }

    const firstName = user.name.split(" ")[0];

    return (
        <>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
                <h1 style={{ font: "700 28px 'Figtree',sans-serif", margin: 0 }}>{greeting()}, {firstName}</h1>
                {nextAppt && (
                    <Link href={`/pro/session/${nextAppt.id}`} className="btn">Start next session</Link>
                )}
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "14px", marginTop: "20px" }}>
                {[
                    { label: "Sessions today", value: today.length },
                    { label: "Unread messages", value: "—" },
                    { label: "New referrals", value: "—" },
                    { label: "Off track", value: "—" },
                ].map(s => (
                    <div key={s.label} className="card">
                        <div className="muted" style={{ font: "500 13px 'Figtree',sans-serif" }}>{s.label}</div>
                        <div style={{ font: "700 30px 'Figtree',sans-serif" }}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "20px", alignItems: "flex-start" }}>
                {/* Today's sessions */}
                <div className="card" style={{ flex: "1 1 300px" }}>
                    <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>Today</h2>
                    {today.length === 0 ? (
                        <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif", marginTop: "12px" }}>
                            No sessions scheduled today.{" "}
                            <Link href="/pro/appointments" style={{ color: "#1b766e", textDecoration: "underline" }}>View calendar</Link>
                        </div>
                    ) : (
                        today.map(a => (
                            <div key={a.id} className="row" style={{ marginTop: "10px" }}>
                                <span style={{ width: "64px", font: "700 15px 'Figtree',sans-serif" }}>
                                    {new Date(a.startsAt).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ font: "600 15px 'Figtree',sans-serif" }}>{a.patient.user.name}</div>
                                    <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif" }}>
                                        {a.mode === "HOME" ? "Home visit" : "Video"}{a.type ? ` · ${a.type.toLowerCase()}` : ""}
                                    </div>
                                </div>
                                <Link href={`/pro/session/${a.id}`} className="btn btn2" style={{ minHeight: "36px", fontSize: "13px" }}>Join</Link>
                            </div>
                        ))
                    )}
                </div>

                {/* Needs attention placeholder */}
                <div className="card" style={{ flex: "1 1 380px" }}>
                    <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>Needs attention</h2>
                    <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif", marginTop: "12px" }}>
                        No items require your attention right now.
                    </div>
                </div>
            </div>
        </>
    );
}
