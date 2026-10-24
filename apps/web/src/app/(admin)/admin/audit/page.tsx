import { Card } from "@physio/ui";
import { apiFetch } from "@/lib/api";
import { requireSession } from "@/lib/session";

type AuditEntry = {
    id: string;
    actorId: string;
    action: string;
    entity: string;
    entityId: string;
    at: string;
    actor: { name: string; email: string } | null;
};

export default async function AdminAuditPage() {
    await requireSession(["ADMIN"]);

    let entries: AuditEntry[] = [];
    try {
        entries = await apiFetch<AuditEntry[]>("/admin/audit");
    } catch {
        // empty state
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Audit log</h1>
            <p className="mt-1 text-sm text-text-muted">
                Last {entries.length} events. All admin and security-sensitive actions are recorded.
            </p>

            <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                            <th className="pb-2 pr-4">When</th>
                            <th className="pb-2 pr-4">Actor</th>
                            <th className="pb-2 pr-4">Action</th>
                            <th className="pb-2 pr-4">Entity</th>
                            <th className="pb-2">ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((e) => (
                            <tr key={e.id} className="border-b border-border/40">
                                <td className="py-2 pr-4 text-xs text-text-muted">
                                    {new Date(e.at).toLocaleString()}
                                </td>
                                <td className="py-2 pr-4">
                                    {e.actor ? (
                                        <>
                                            <p className="font-medium">{e.actor.name}</p>
                                            <p className="text-xs text-text-muted">{e.actor.email}</p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-text-muted font-mono">{e.actorId}</p>
                                    )}
                                </td>
                                <td className="py-2 pr-4 font-mono text-xs">{e.action}</td>
                                <td className="py-2 pr-4 text-xs">{e.entity}</td>
                                <td className="py-2 font-mono text-xs text-text-muted truncate max-w-[120px]">
                                    {e.entityId.slice(0, 8)}…
                                </td>
                            </tr>
                        ))}
                        {entries.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-text-muted">
                                    No audit entries yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
