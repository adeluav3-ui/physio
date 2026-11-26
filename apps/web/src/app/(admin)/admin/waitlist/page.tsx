import { apiFetch } from "@/lib/api";
import { requireSession } from "@/lib/session";
import WaitlistTable from "./waitlist-table";

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
        <div style={{ padding: "24px" }}>
            <h1 style={{ font: "700 24px 'Figtree',sans-serif", margin: "0 0 6px" }}>Specialist waitlist</h1>
            <div style={{ font: "400 14px 'Figtree',sans-serif", color: "#4f6478", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "16px" }}>
                <span>{entries.length} total</span>
                <span>{pilots} pilot testers</span>
                <span>{professionals} specialists</span>
                <span>{patients} patients (hidden by default)</span>
            </div>
            <WaitlistTable entries={entries} />
        </div>
    );
}
