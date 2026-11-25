import { Card } from "@physio/ui";
import { apiFetch } from "@/lib/api";
import { requireSession } from "@/lib/session";
import FallbackCaseActions from "./actions";

type FallbackCase = {
    id: string;
    status: "OPEN" | "CONTACTED" | "RESOLVED" | "CLOSED";
    adminNote: string | null;
    createdAt: string;
    intake: {
        complaint: string;
        bodyRegion: string;
        painScore: number;
        triage: { level: string; reasons: string[] } | null;
    };
    patient: { user: { name: string; email: string } };
};

const STATUS_STYLES: Record<string, string> = {
    OPEN: "bg-[#fde8e8] text-[#8f1d1d]",
    CONTACTED: "bg-[#fdf1d8] text-[#7a4f00]",
    RESOLVED: "bg-[#e3f4e8] text-[#1d5c34]",
    CLOSED: "bg-neutral-100 text-neutral-700",
};

export default async function FallbackCasesPage() {
    await requireSession(["ADMIN"]);

    let cases: FallbackCase[] = [];
    try {
        cases = await apiFetch<FallbackCase[]>("/admin/fallback-cases");
    } catch {
        // empty state
    }

    const openCount = cases.filter((c) => c.status === "OPEN").length;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">In-Person Required — Fallback Queue</h1>
            <p className="mt-1 text-sm text-text-muted">
                Patients who cannot be served online. Contact and signpost to in-person services.
            </p>

            <div className="mt-3 flex gap-3">
                <span className="rounded-full bg-[#fde8e8] px-3 py-1 text-xs font-semibold text-[#8f1d1d]">
                    {openCount} open
                </span>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                    {cases.length} total
                </span>
            </div>

            <Card padding="none" className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-text-muted">
                        <tr>
                            <th className="px-4 py-2">Patient</th>
                            <th className="px-4 py-2">Complaint</th>
                            <th className="px-4 py-2">Pain</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Logged</th>
                            <th className="px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cases.map((c) => (
                            <tr key={c.id} className="border-t border-border">
                                <td className="px-4 py-2">
                                    <p className="font-medium">{c.patient.user.name}</p>
                                    <p className="text-xs text-text-muted">{c.patient.user.email}</p>
                                </td>
                                <td className="px-4 py-2 text-xs">
                                    <p>{c.intake.complaint}</p>
                                    <p className="text-text-muted">{c.intake.bodyRegion}</p>
                                </td>
                                <td className="px-4 py-2 text-xs font-semibold">{c.intake.painScore}/10</td>
                                <td className="px-4 py-2">
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[c.status] ?? ""}`}>
                                        {c.status}
                                    </span>
                                    {c.adminNote && (
                                        <p className="mt-1 text-xs text-text-muted">{c.adminNote}</p>
                                    )}
                                </td>
                                <td className="px-4 py-2 text-xs text-text-muted">
                                    {new Date(c.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2">
                                    <FallbackCaseActions id={c.id} currentStatus={c.status} />
                                </td>
                            </tr>
                        ))}
                        {cases.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                                    No fallback cases.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
