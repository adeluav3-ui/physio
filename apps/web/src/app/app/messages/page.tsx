import { requireSession } from "@/lib/session";
import Link from "next/link";

export default async function MessagesPage() {
    await requireSession(["PATIENT"]);

    return (
        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <h1 style={{ font: "700 26px 'Figtree',sans-serif", margin: 0 }}>Messages</h1>
            <div className="card" style={{ color: "#4f6663", font: "400 15px/1.5 'Figtree',sans-serif" }}>
                No conversations yet. Messages from your specialist will appear here after your first session.
            </div>
        </div>
    );
}
