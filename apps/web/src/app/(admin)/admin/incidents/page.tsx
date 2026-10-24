import { requireSession } from "@/lib/session";

export default async function AdminIncidentsPage() {
    await requireSession(["ADMIN"]);
    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Incidents</h1>
            <p className="mt-2 text-sm text-text-muted">Coming soon.</p>
        </div>
    );
}
