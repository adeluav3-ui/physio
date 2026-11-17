import { Card } from "@physio/ui";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";

type Incident = {
    id: string;
    body: string;
    sentAt: string;
    sender: { name: string; role: string };
    thread: {
        patient: { name: string; email: string };
        physio: { name: string };
    };
};

export default async function AdminIncidentsPage() {
    await requireSession(["ADMIN"]);

    let incidents: Incident[] = [];
    try {
        incidents = await apiFetch<Incident[]>("/admin/incidents");
        incidents.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    } catch {
        // empty state or endpoint not yet wired
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Incidents</h1>
            <p className="mt-1 text-sm text-text-muted">
                {incidents.length} flagged message{incidents.length !== 1 ? "s" : ""} detected.
            </p>

            <div className="mt-4 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <span className="mt-0.5 shrink-0 text-base leading-none">⚑</span>
                <p>
                    These messages triggered the red-flag detector. The physio was notified
                    automatically.
                </p>
            </div>

            {incidents.length === 0 ? (
                <div className="mt-6 flex flex-col items-center justify-center rounded-md border border-green-200 bg-green-50 py-12 text-green-700">
                    <span className="text-3xl">✓</span>
                    <p className="mt-2 font-medium">No incidents detected</p>
                    <p className="mt-1 text-sm text-green-600">
                        All messages are within normal parameters.
                    </p>
                </div>
            ) : (
                <Card padding="none" className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-text-muted">
                            <tr>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2">Patient</th>
                                <th className="px-4 py-2">Physio</th>
                                <th className="px-4 py-2">Sender</th>
                                <th className="px-4 py-2">Message preview</th>
                            </tr>
                        </thead>
                        <tbody>
                            {incidents.map((inc) => (
                                <tr key={inc.id} className="border-t border-border">
                                    <td className="px-4 py-2 text-xs text-text-muted whitespace-nowrap">
                                        {new Date(inc.sentAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2">
                                        <p className="font-medium">{inc.thread.patient.name}</p>
                                        <p className="text-xs text-text-muted">{inc.thread.patient.email}</p>
                                    </td>
                                    <td className="px-4 py-2">{inc.thread.physio.name}</td>
                                    <td className="px-4 py-2">
                                        <p>{inc.sender.name}</p>
                                        <p className="text-xs text-text-muted">{inc.sender.role}</p>
                                    </td>
                                    <td className="px-4 py-2 text-xs text-text-muted max-w-xs">
                                        {inc.body.length > 100
                                            ? `${inc.body.slice(0, 100)}…`
                                            : inc.body}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
}
