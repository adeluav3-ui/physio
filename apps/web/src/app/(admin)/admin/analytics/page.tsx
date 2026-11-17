import { Card } from "@physio/ui";
import { apiFetch } from "@/lib/api";
import { requireSession } from "@/lib/session";

type Analytics = {
    totalUsers: number;
    totalPhysios: number;
    totalPatients: number;
    totalAppointments: number;
    completedAppointments: number;
    pendingVerifications: number;
    revenueKobo: number;
    activePrograms: number;
    totalReviews: number;
    averageRating: number | null;
    recentAppointments: { createdAt: string; status: string }[];
};

function KpiCard({
    label,
    value,
    highlight,
}: {
    label: string;
    value: string | number;
    highlight?: boolean;
}) {
    return (
        <Card
            className={
                highlight
                    ? "border-amber-300 bg-[#fffbeb]"
                    : ""
            }
        >
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
            <p
                className={`mt-1 text-2xl font-bold ${
                    highlight ? "text-amber-700" : "text-text"
                }`}
            >
                {value}
            </p>
        </Card>
    );
}

export default async function AdminAnalyticsPage() {
    await requireSession(["ADMIN"]);

    let data: Analytics | null = null;
    try {
        data = await apiFetch<Analytics>("/admin/analytics");
    } catch {
        // empty state
    }

    if (!data) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-semibold">Analytics</h1>
                <p className="mt-2 text-sm text-text-muted">Could not load analytics data.</p>
            </div>
        );
    }

    const revenue = `₦${(data.revenueKobo / 100).toLocaleString("en-NG")}`;
    const avgRating =
        data.averageRating != null ? data.averageRating.toFixed(1) : "—";

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Analytics</h1>
            <p className="mt-1 text-sm text-text-muted">Platform-wide metrics at a glance.</p>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <KpiCard label="Total users" value={data.totalUsers} />
                <KpiCard label="Verified physios" value={data.totalPhysios} />
                <KpiCard label="Patients" value={data.totalPatients} />
                <KpiCard label="Total appointments" value={data.totalAppointments} />
                <KpiCard label="Completed sessions" value={data.completedAppointments} />
                <KpiCard label="Revenue" value={revenue} />
                <KpiCard
                    label="Pending verifications"
                    value={data.pendingVerifications}
                    highlight={data.pendingVerifications > 0}
                />
                <KpiCard label="Active programs" value={data.activePrograms} />
                <KpiCard label="Avg rating" value={avgRating} />
            </div>
        </div>
    );
}
