import { Card } from "@physio/ui";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";

type HomeVisit = {
    id: string;
    address: string;
    status: string;
    checkInAt: string | null;
    checkOutAt: string | null;
    createdAt: string;
    appointment: {
        startsAt: string;
        status: string;
        patient: { user: { name: string } };
        physio: { user: { name: string } };
    };
};

const visitStatusChip: Record<string, string> = {
    REQUESTED: "bg-blue-100 text-blue-700",
    MATCHING: "bg-yellow-100 text-yellow-700",
    SCHEDULED: "bg-blue-100 text-blue-700",
    EN_ROUTE: "bg-orange-100 text-orange-700",
    IN_PROGRESS: "bg-green-100 text-green-700",
    COMPLETED: "bg-neutral-100 text-neutral-600",
    CANCELLED: "bg-red-100 text-red-700",
};

function VisitStatusChip({ status }: { status: string }) {
    const cls = visitStatusChip[status] ?? "bg-neutral-100 text-neutral-600";
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
            {status.replace(/_/g, " ")}
        </span>
    );
}

export default async function AdminHomeVisitsPage() {
    await requireSession(["ADMIN"]);

    let visits: HomeVisit[] = [];
    try {
        visits = await apiFetch<HomeVisit[]>("/admin/home-visits");
        visits.sort((a, b) => b.appointment.startsAt.localeCompare(a.appointment.startsAt));
    } catch {
        // empty state or endpoint not yet wired
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Home visits</h1>
            <p className="mt-1 text-sm text-text-muted">
                {visits.length} home visit{visits.length !== 1 ? "s" : ""} across the platform.
            </p>

            <Card padding="none" className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-text-muted">
                        <tr>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Patient</th>
                            <th className="px-4 py-2">Physio</th>
                            <th className="px-4 py-2">Address</th>
                            <th className="px-4 py-2">Visit status</th>
                            <th className="px-4 py-2">Appt status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visits.map((v) => (
                            <tr key={v.id} className="border-t border-border">
                                <td className="px-4 py-2 text-xs text-text-muted whitespace-nowrap">
                                    {new Date(v.appointment.startsAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-2">{v.appointment.patient.user.name}</td>
                                <td className="px-4 py-2">{v.appointment.physio.user.name}</td>
                                <td className="px-4 py-2 text-xs max-w-[180px] truncate" title={v.address}>
                                    {v.address}
                                </td>
                                <td className="px-4 py-2">
                                    <VisitStatusChip status={v.status} />
                                </td>
                                <td className="px-4 py-2">
                                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium">
                                        {v.appointment.status.replace(/_/g, " ")}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {visits.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                                    No home visits yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
