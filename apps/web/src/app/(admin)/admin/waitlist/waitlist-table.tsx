"use client";

import { useState } from "react";

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

export default function WaitlistTable({ entries }: { entries: WaitlistEntry[] }) {
    const [showPatients, setShowPatients] = useState(false);

    const visible = showPatients ? entries : entries.filter((e) => e.role !== "PATIENT");

    return (
        <>
            <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", font: "400 14px 'Figtree',sans-serif", color: "#4f6478", cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={showPatients}
                        onChange={e => setShowPatients(e.target.checked)}
                        style={{ width: "16px", height: "16px", accentColor: "#1b7d0e" }}
                    />
                    Show patient entries
                </label>
            </div>

            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", font: "400 14px 'Figtree',sans-serif", color: "#022449" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid #d9e3ec", font: "600 12px 'Figtree',sans-serif", color: "#4f6478", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            <th style={{ paddingBottom: "8px", paddingRight: "16px", textAlign: "left" }}>Email</th>
                            <th style={{ paddingBottom: "8px", paddingRight: "16px", textAlign: "left" }}>Name</th>
                            <th style={{ paddingBottom: "8px", paddingRight: "16px", textAlign: "left" }}>Role</th>
                            <th style={{ paddingBottom: "8px", paddingRight: "16px", textAlign: "left" }}>Discipline</th>
                            <th style={{ paddingBottom: "8px", paddingRight: "16px", textAlign: "left" }}>Pilot</th>
                            <th style={{ paddingBottom: "8px", textAlign: "left" }}>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((e) => (
                            <tr key={e.id} style={{ borderBottom: "1px solid #eef3f8" }}>
                                <td style={{ padding: "10px 16px 10px 0" }}>{e.email}</td>
                                <td style={{ padding: "10px 16px 10px 0", color: "#4f6478" }}>{e.name ?? "—"}</td>
                                <td style={{ padding: "10px 16px 10px 0" }}>
                                    <span style={{
                                        display: "inline-block", padding: "2px 8px", borderRadius: 99,
                                        font: "600 12px 'Figtree',sans-serif",
                                        background: e.role === "PHYSIO" ? "#e3f4e8" : "#eef3f8",
                                        color: e.role === "PHYSIO" ? "#1d5c34" : "#4f6478",
                                    }}>
                                        {e.role}
                                    </span>
                                </td>
                                <td style={{ padding: "10px 16px 10px 0", fontSize: "13px" }}>{e.discipline ?? "—"}</td>
                                <td style={{ padding: "10px 16px 10px 0" }}>
                                    {e.pilotTester && (
                                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 99, font: "600 12px 'Figtree',sans-serif", background: "#e6f4e1", color: "#0f5a08" }}>
                                            Pilot
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: "10px 0", fontSize: "13px", color: "#4f6478" }}>
                                    {new Date(e.createdAt).toLocaleDateString("en-NG")}
                                </td>
                            </tr>
                        ))}
                        {visible.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: "32px 0", textAlign: "center", color: "#4f6478" }}>
                                    No entries.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
