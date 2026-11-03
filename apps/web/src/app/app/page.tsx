import Link from "next/link";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";

type Appointment = {
    id: string;
    startsAt: string;
    status: string;
    physio: { user: { name: string } };
};

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

export default async function PatientHome() {
    const user = await requireSession(["PATIENT"]);

    let appointments: Appointment[] = [];
    try { appointments = await apiFetch<Appointment[]>("/booking/appointments"); } catch { /* empty */ }

    const next = appointments
        .filter(a => a.status === "CONFIRMED" && new Date(a.startsAt) > new Date())
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null;

    const nextLabel = next
        ? new Date(next.startsAt).toLocaleString("en-NG", { weekday: "long", hour: "numeric", minute: "2-digit" })
        : null;
    const proName = next?.physio.user.name ?? "[Professional name]";

    return (
        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Greeting + logo icon */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div className="muted" style={{ font: "500 14px 'Figtree',sans-serif" }}>{greeting()}</div>
                    <h1 style={{ font: "700 26px 'Figtree',sans-serif", margin: 0 }}>Your day</h1>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/logo-icon-web.png" alt="Rehab360" style={{ height: "44px", width: "auto" }} />
            </div>

            {/* Next session */}
            {next ? (
                <div className="card" style={{ background: "#022449", borderColor: "#022449", color: "#fff" }}>
                    <div style={{ font: "600 13px 'Figtree',sans-serif", color: "#9fc1e0" }}>Next session</div>
                    <div style={{ font: "700 20px 'Figtree',sans-serif", marginTop: "4px" }}>{nextLabel}</div>
                    <div style={{ font: "400 15px 'Figtree',sans-serif", marginTop: "2px", color: "#c9d9ec" }}>Video with {proName}</div>
                    <Link href={`/app/session/${next.id}`} className="btn" style={{ background: "#fff", color: "#022449", marginTop: "14px", minHeight: "46px", display: "flex" }}>
                        Join when it opens
                    </Link>
                </div>
            ) : (
                <div className="card" style={{ background: "#022449", borderColor: "#022449", color: "#fff" }}>
                    <div style={{ font: "600 13px 'Figtree',sans-serif", color: "#9fc1e0" }}>No upcoming sessions</div>
                    <div style={{ font: "400 15px 'Figtree',sans-serif", marginTop: "4px", color: "#c9d9ec" }}>Find a professional to book your first session.</div>
                    <Link href="/professionals" className="btn" style={{ background: "#fff", color: "#022449", marginTop: "14px", minHeight: "46px", display: "flex" }}>
                        Find a specialist
                    </Link>
                </div>
            )}

            {/* Today's tasks */}
            <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ font: "700 17px 'Figtree',sans-serif", margin: 0 }}>{"Today's tasks"}</h2>
                    <span className="chip-sm">0 of 0 done</span>
                </div>
                <div className="bar" style={{ marginTop: "12px" }}>
                    <div style={{ width: "0%", height: "8px", borderRadius: "99px", background: "#1b7d0e" }}></div>
                </div>
                <div style={{ marginTop: "12px", font: "400 14px 'Figtree',sans-serif", color: "#4f6478" }}>
                    No tasks yet. Your specialist will add exercises or goals after your first session.
                </div>
            </div>

            {/* Message card */}
            <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ font: "600 15px 'Figtree',sans-serif" }}>Messages</div>
                    <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif" }}>From your specialists</div>
                </div>
                <Link href="/app/messages" className="chip-sm">Open</Link>
            </div>

            {/* Streak */}
            <div className="card">
                <div className="muted" style={{ font: "500 13px 'Figtree',sans-serif" }}>Streak</div>
                <div style={{ font: "700 22px 'Figtree',sans-serif" }}>Keep it up!</div>
            </div>
        </div>
    );
}
