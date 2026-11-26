import { apiFetch } from "@/lib/api";
import { requireSession } from "@/lib/session";
import PilotSettingsForm from "./pilot-settings-form";

type PilotDashboard = {
    pilotActive: boolean;
    pilotStart: string | null;
    pilotEnd: string | null;
    sessionTarget: number;
    completedSessions: number;
    progressPct: number;
    pilotSpecialists: number;
    totalVideoMinutes: number;
    commissionBps: number;
    serviceFeeBps: number;
    freeIntroVideoSessions: number;
    videoAddonKobo: number;
};

type PilotSettings = {
    pilotModeEnabled: boolean;
    pilotStartDate: string;
    pilotEndDate: string;
    commissionBps: number;
    serviceFeeBps: number;
    serviceFeeCapKobo: number;
    freeIntroVideoSessions: number;
    videoAddonKobo: number;
    sessionTarget: number;
};

export default async function PilotPage() {
    await requireSession(["ADMIN"]);

    let dash: PilotDashboard | null = null;
    let settings: PilotSettings | null = null;
    try {
        [dash, settings] = await Promise.all([
            apiFetch<PilotDashboard>("/admin/pilot-dashboard"),
            apiFetch<PilotSettings>("/admin/pilot-settings"),
        ]);
    } catch { /* empty */ }

    if (!dash || !settings) {
        return <p style={{ font: "400 15px 'Figtree',sans-serif" }}>Could not load pilot data.</p>;
    }

    const barWidth = Math.min(dash.progressPct, 100);

    return (
        <>
            <h1 style={{ font: "700 28px 'Figtree',sans-serif", margin: "0 0 20px" }}>Pilot dashboard</h1>

            {/* Status chips */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                <span className={`chip ${dash.pilotActive ? "ok" : "warn"}`}>
                    {dash.pilotActive ? "● Pilot active" : "○ Pilot inactive"}
                </span>
                {dash.pilotStart && dash.pilotEnd && (
                    <span className="chip">
                        {new Date(dash.pilotStart).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                        {" – "}
                        {new Date(dash.pilotEnd).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                )}
            </div>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "14px", marginBottom: "24px" }}>
                {[
                    { label: "Sessions completed", value: `${dash.completedSessions} / ${dash.sessionTarget}` },
                    { label: "Founding specialists", value: dash.pilotSpecialists },
                    { label: "Video minutes used", value: dash.totalVideoMinutes.toLocaleString() },
                    { label: "Commission rate", value: `${(dash.commissionBps / 100).toFixed(1)}%` },
                    { label: "Service fee rate", value: `${(dash.serviceFeeBps / 100).toFixed(1)}%` },
                    { label: "Free video sessions", value: dash.freeIntroVideoSessions },
                    { label: "Video add-on price", value: `₦${(dash.videoAddonKobo / 100).toLocaleString()}` },
                ].map(s => (
                    <div key={s.label} className="card">
                        <div className="muted" style={{ font: "500 12px 'Figtree',sans-serif" }}>{s.label}</div>
                        <div style={{ font: "700 24px 'Figtree',sans-serif", marginTop: "4px" }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Progress bar */}
            <div className="card" style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ font: "600 15px 'Figtree',sans-serif" }}>Session target progress</span>
                    <span style={{ font: "600 15px 'Figtree',sans-serif" }}>{dash.progressPct}%</span>
                </div>
                <div style={{ height: "12px", background: "#e2ecf4", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{
                        height: "100%",
                        width: `${barWidth}%`,
                        background: barWidth >= 100 ? "#1b7d0e" : "#1fa8e0",
                        borderRadius: "99px",
                        transition: "width 0.3s",
                    }} />
                </div>
                <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif", marginTop: "6px" }}>
                    {dash.completedSessions} of {dash.sessionTarget} sessions completed
                </div>
            </div>

            {/* Settings form */}
            <div className="card">
                <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: "0 0 16px" }}>Pilot settings</h2>
                <PilotSettingsForm settings={settings} />
            </div>

            {/* Feedback exports */}
            <div className="card" style={{ marginTop: "24px" }}>
                <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: "0 0 8px" }}>Feedback exports</h2>
                <p className="muted" style={{ font: "400 13px 'Figtree',sans-serif", margin: "0 0 14px" }}>
                    Anonymised CSV — no patient names, appointment IDs and scores only.
                </p>
                <a
                    href="/api/proxy/feedback/export/csv"
                    download
                    className="btn"
                    style={{ display: "inline-block" }}
                >
                    Download feedback CSV
                </a>
            </div>
        </>
    );
}
