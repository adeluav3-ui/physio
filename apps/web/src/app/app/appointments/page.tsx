import Link from "next/link";
import { Card } from "@physio/ui";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import { AutoConfirmPayment } from "./auto-confirm-payment";
import { CancelPendingButton } from "./cancel-pending-button";

type Appointment = {
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
    mode: string;
    type: string;
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

const STATUS_CHIP: Record<string, { background: string; color: string }> = {
    CONFIRMED:       { background: "#e3f8e3", color: "#1b7d0e" },
    IN_PROGRESS:     { background: "#e3f8e3", color: "#1b7d0e" },
    PENDING_PAYMENT: { background: "#fdf1d8", color: "#7a4f00" },
    COMPLETED:       { background: "#eaf1fb", color: "#1a4a7a" },
    CANCELLED:       { background: "#f3f4f6", color: "#6b7280" },
    REFUNDED:        { background: "#f3f4f6", color: "#6b7280" },
};

const TZ = "Africa/Lagos";

function fmt(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", {
        weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: TZ,
    });
}
function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

const JOIN_WINDOW_MS = 15 * 60 * 1000;

function isJoinable(a: Appointment, now: number) {
    if (a.mode !== "VIDEO") return false;
    if (a.status === "IN_PROGRESS") return true;
    if (a.status === "CONFIRMED") {
        const start = new Date(a.startsAt).getTime();
        const end = new Date(a.endsAt).getTime();
        return now >= start - JOIN_WINDOW_MS && now <= end + 90 * 60 * 1000;
    }
    return false;
}

function ApptCard({ a, now }: { a: Appointment; now: number }) {
    const chip = STATUS_CHIP[a.status] ?? { background: "#f3f4f6", color: "#6b7280" };
    const joinable = isJoinable(a, now);
    return (
        <div className="card" style={{ padding: "14px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ font: "600 15px 'Figtree',sans-serif" }}>{a.physio.user.name}</div>
                    <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif", marginTop: "2px" }}>
                        {fmt(a.startsAt)} · {fmtTime(a.startsAt)}
                    </div>
                    <div className="muted" style={{ font: "400 12px 'Figtree',sans-serif", marginTop: "1px" }}>
                        {a.mode}
                    </div>
                </div>
                <span style={{ flexShrink: 0, padding: "3px 10px", borderRadius: 99, font: "500 12px 'Figtree',sans-serif", ...chip }}>
                    {STATUS_LABEL[a.status] ?? a.status}
                </span>
            </div>
            <div style={{ marginTop: "10px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                {joinable ? (
                    <Link
                        href={`/app/session/${a.id}`}
                        style={{ display: "inline-block", padding: "8px 20px", borderRadius: 10, background: "var(--blue-dark)", color: "#fff", font: "600 13px 'Figtree',sans-serif", textDecoration: "none" }}
                    >
                        Join session
                    </Link>
                ) : (
                    <Link href={`/app/appointments/${a.id}`} style={{ font: "600 13px 'Figtree',sans-serif", color: "var(--blue-dark)", textDecoration: "none" }}>
                        View details
                    </Link>
                )}
                {a.status === "PENDING_PAYMENT" && (
                    <>
                        <AutoConfirmPayment appointmentId={a.id} />
                        <CancelPendingButton appointmentId={a.id} />
                    </>
                )}
            </div>
        </div>
    );
}

export default async function PatientAppointmentsPage() {
    await requireSession(["PATIENT"]);

    let appointments: Appointment[] = [];
    try {
        appointments = await apiFetch<Appointment[]>("/booking/appointments");
    } catch {
        // show empty state
    }

    const nowMs = Date.now();
    const now = new Date(nowMs);

    const pending  = appointments.filter(a => a.status === "PENDING_PAYMENT");
    // IN_PROGRESS is always "upcoming" regardless of startsAt — session is live
    const upcoming = appointments
        .filter(a => a.status === "IN_PROGRESS" || (a.status === "CONFIRMED" && new Date(a.startsAt) >= now))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const past = appointments
        .filter(a => a.status === "COMPLETED" || a.status === "REFUNDED" || a.status === "NO_SHOW")
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    const cancelled = appointments
        .filter(a => a.status === "CANCELLED")
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

    function Section({ title, items, empty }: { title: string; items: Appointment[]; empty?: string }) {
        return (
            <div style={{ marginBottom: "24px" }}>
                <div style={{ font: "600 13px 'Figtree',sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: "10px" }}>
                    {title}
                </div>
                {items.length === 0 ? (
                    <div className="card" style={{ padding: "14px 20px" }}>
                        <span className="muted" style={{ font: "400 14px 'Figtree',sans-serif" }}>{empty ?? "None"}</span>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {items.map(a => <ApptCard key={a.id} a={a} now={nowMs} />)}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "600px" }}>
            <h1 style={{ font: "700 24px 'Figtree',sans-serif", margin: "0 0 24px" }}>My appointments</h1>

            {appointments.length === 0 ? (
                <Card>
                    <p className="text-sm text-text-muted">No appointments yet.</p>
                    <Link href="/app/intake/complaint" className="mt-3 inline-block text-sm font-medium text-primary-600 underline">
                        Start intake to book
                    </Link>
                </Card>
            ) : (
                <>
                    {pending.length > 0 && <Section title="Awaiting payment" items={pending} />}
                    <Section title="Upcoming" items={upcoming} empty="No upcoming appointments." />
                    <Section title="Past" items={past} empty="No past appointments yet." />
                    {cancelled.length > 0 && <Section title="Cancelled" items={cancelled} />}
                </>
            )}
        </div>
    );
}
