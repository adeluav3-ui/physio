import { Card, Chip } from "@physio/ui";
import { apiFetch } from "@/lib/api";
import { requireSession } from "@/lib/session";
import { DISCIPLINE_LABELS } from "@physio/shared";

type AdminReferral = {
    id: string;
    toDiscipline: string;
    urgency: string;
    status: string;
    patientConsented: boolean;
    createdAt: string;
    patient: { user: { name: string; email: string } };
    sender: { user: { name: string } };
    receiver: { user: { name: string } } | null;
};

const STATUS_VARIANT: Record<string, "default" | "accent" | "ok" | "warn" | "danger"> = {
    SENT: "default",
    PATIENT_CONSENTED: "accent",
    ACCEPTED: "ok",
    DECLINED: "danger",
    BOOKED: "ok",
    SESSION_HELD: "ok",
    SUMMARY_SENT: "ok",
    CONFIRMED: "ok",
    CLOSED: "default",
    EXPIRED: "warn",
};

export default async function AdminReferralsPage() {
    await requireSession(["ADMIN"]);

    let referrals: AdminReferral[] = [];
    try {
        referrals = await apiFetch<AdminReferral[]>("/referrals/admin/all");
    } catch {
        // empty state
    }

    const byStatus = referrals.reduce<Record<string, number>>((acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Referrals</h1>
            <p className="mt-1 text-sm text-text-muted">{referrals.length} total referrals.</p>

            <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(byStatus).map(([status, count]) => (
                    <span key={status} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                        {status.replace(/_/g, " ")}: {count}
                    </span>
                ))}
            </div>

            <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                            <th className="pb-2 pr-4">Patient</th>
                            <th className="pb-2 pr-4">Discipline</th>
                            <th className="pb-2 pr-4">Sender</th>
                            <th className="pb-2 pr-4">Receiver</th>
                            <th className="pb-2 pr-4">Status</th>
                            <th className="pb-2 pr-4">Urgency</th>
                            <th className="pb-2">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {referrals.map((r) => (
                            <tr key={r.id} className="border-b border-border/40 py-2">
                                <td className="py-2 pr-4">
                                    <p className="font-medium">{r.patient.user.name}</p>
                                    <p className="text-xs text-text-muted">{r.patient.user.email}</p>
                                </td>
                                <td className="py-2 pr-4 text-xs">
                                    {DISCIPLINE_LABELS[r.toDiscipline as keyof typeof DISCIPLINE_LABELS] ?? r.toDiscipline}
                                </td>
                                <td className="py-2 pr-4 text-xs">{r.sender.user.name}</td>
                                <td className="py-2 pr-4 text-xs">{r.receiver?.user.name ?? "—"}</td>
                                <td className="py-2 pr-4">
                                    <Chip variant={STATUS_VARIANT[r.status] ?? "default"}>
                                        {r.status.replace(/_/g, " ")}
                                    </Chip>
                                </td>
                                <td className="py-2 pr-4 text-xs">{r.urgency}</td>
                                <td className="py-2 text-xs text-text-muted">
                                    {new Date(r.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {referrals.length === 0 && (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-text-muted">
                                    No referrals yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
