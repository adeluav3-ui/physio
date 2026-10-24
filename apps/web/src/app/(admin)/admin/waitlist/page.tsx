import { Card, Chip } from "@physio/ui";
import { apiFetch } from "@/lib/api";
import { requireSession } from "@/lib/session";

type WaitlistEntry = {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    role: string;
    discipline: string | null;
    pilotTester: boolean;
    createdAt: string;
};

export default async function AdminWaitlistPage() {
    await requireSession(["ADMIN"]);

    let entries: WaitlistEntry[] = [];
    try {
        entries = await apiFetch<WaitlistEntry[]>("/admin/waitlist");
    } catch {
        // empty state
    }

    const pilots = entries.filter((e) => e.pilotTester).length;
    const professionals = entries.filter((e) => e.role === "PHYSIO").length;
    const patients = entries.filter((e) => e.role === "PATIENT").length;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Waitlist</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-text-muted">
                <span>{entries.length} total</span>
                <span>{pilots} pilot testers</span>
                <span>{professionals} professionals</span>
                <span>{patients} patients</span>
            </div>

            <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                            <th className="pb-2 pr-4">Email</th>
                            <th className="pb-2 pr-4">Name</th>
                            <th className="pb-2 pr-4">Role</th>
                            <th className="pb-2 pr-4">Discipline</th>
                            <th className="pb-2 pr-4">Pilot</th>
                            <th className="pb-2">Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((e) => (
                            <tr key={e.id} className="border-b border-border/40">
                                <td className="py-2 pr-4">{e.email}</td>
                                <td className="py-2 pr-4 text-text-muted">{e.name ?? "—"}</td>
                                <td className="py-2 pr-4">
                                    <Chip variant={e.role === "PHYSIO" ? "accent" : "default"}>
                                        {e.role}
                                    </Chip>
                                </td>
                                <td className="py-2 pr-4 text-xs">{e.discipline ?? "—"}</td>
                                <td className="py-2 pr-4">
                                    {e.pilotTester && <Chip variant="ok">Pilot</Chip>}
                                </td>
                                <td className="py-2 text-xs text-text-muted">
                                    {new Date(e.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {entries.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-text-muted">
                                    No waitlist entries yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
