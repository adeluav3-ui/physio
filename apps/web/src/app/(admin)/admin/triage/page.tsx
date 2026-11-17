import { Card } from "@physio/ui";
import { apiFetch } from "@/lib/api";
import { requireSession } from "@/lib/session";

type TriageEntry = {
    id: string;
    level: string;
    reasons: string[];
    createdAt: string;
    intake: {
        complaint: string;
        bodyRegion: string;
        painScore: number;
        createdAt: string;
        patient: {
            user: { name: string; email: string };
        };
    };
};

const LEVEL_STYLES: Record<string, string> = {
    RED: "bg-[#fde8e8] text-[#8f1d1d]",
    AMBER: "bg-[#fdf1d8] text-[#7a4f00]",
    GREEN: "bg-[#e3f4e8] text-[#1d5c34]",
};

export default async function AdminTriagePage() {
    await requireSession(["ADMIN"]);

    let entries: TriageEntry[] = [];
    try {
        entries = await apiFetch<TriageEntry[]>("/admin/triage");
        entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
        // empty state
    }

    const counts = entries.reduce<Record<string, number>>((acc, e) => {
        acc[e.level] = (acc[e.level] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Triage</h1>
            <p className="mt-1 text-sm text-text-muted">{entries.length} triage records.</p>

            <div className="mt-4 flex flex-wrap gap-2">
                {(["RED", "AMBER", "GREEN"] as const).map((level) => (
                    <span
                        key={level}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            LEVEL_STYLES[level] ?? "bg-neutral-100 text-neutral-700"
                        }`}
                    >
                        {counts[level] ?? 0} {level}
                    </span>
                ))}
            </div>

            <Card padding="none" className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-text-muted">
                        <tr>
                            <th className="px-4 py-2">Patient</th>
                            <th className="px-4 py-2">Complaint</th>
                            <th className="px-4 py-2">Body region</th>
                            <th className="px-4 py-2">Pain score</th>
                            <th className="px-4 py-2">Triage level</th>
                            <th className="px-4 py-2">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((e) => (
                            <tr key={e.id} className="border-t border-border">
                                <td className="px-4 py-2">
                                    <p className="font-medium">{e.intake.patient.user.name}</p>
                                    <p className="text-xs text-text-muted">
                                        {e.intake.patient.user.email}
                                    </p>
                                </td>
                                <td className="px-4 py-2 text-xs">{e.intake.complaint}</td>
                                <td className="px-4 py-2 text-xs">{e.intake.bodyRegion}</td>
                                <td className="px-4 py-2 text-xs font-semibold">
                                    {e.intake.painScore}
                                </td>
                                <td className="px-4 py-2">
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            LEVEL_STYLES[e.level] ?? "bg-neutral-100 text-neutral-700"
                                        }`}
                                    >
                                        {e.level}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-xs text-text-muted">
                                    {new Date(e.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {entries.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                                    No triage records yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
