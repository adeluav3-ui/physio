"use client";

import { useEffect, useState } from "react";
import { DISCIPLINE_LABELS } from "@physio/shared";

type UserRow = {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    physioProfile: { discipline: string; licenceStatus: string } | null;
};

const ROLE_CHIP: Record<string, string> = {
    PATIENT: "chip",
    PHYSIO: "chip ok",
    ADMIN: "chip warn",
};

const STATUS_CHIP: Record<string, string> = {
    ACTIVE: "chip ok",
    PENDING: "chip warn",
    SUSPENDED: "chip err",
};

const LICENCE_CHIP: Record<string, string> = {
    VERIFIED: "chip ok",
    UNVERIFIED: "chip warn",
    REJECTED: "chip err",
    EXPIRED: "chip err",
};

type Filter = "ALL" | "PATIENT" | "PHYSIO" | "ADMIN";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>("ALL");
    const [search, setSearch] = useState("");
    const [promoting, setPromoting] = useState<string | null>(null);
    const [roleErr, setRoleErr] = useState<{ id: string; msg: string } | null>(null);

    useEffect(() => {
        fetch("/api/proxy/admin/users")
            .then(r => r.json())
            .then(setUsers)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    async function setRole(userId: string, role: "ADMIN" | "PATIENT" | "PHYSIO") {
        setPromoting(userId);
        setRoleErr(null);
        try {
            const r = await fetch(`/api/proxy/admin/users/${userId}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role }),
            });
            if (!r.ok) {
                const body = await r.json().catch(() => ({}));
                throw new Error(body.message ?? "Failed to update role");
            }
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
        } catch (e) {
            setRoleErr({ id: userId, msg: (e as Error).message });
        }
        setPromoting(null);
    }

    const visible = users.filter(u => {
        if (filter !== "ALL" && u.role !== filter) return false;
        if (search) {
            const q = search.toLowerCase();
            return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        }
        return true;
    });

    const counts = {
        ALL: users.length,
        PATIENT: users.filter(u => u.role === "PATIENT").length,
        PHYSIO: users.filter(u => u.role === "PHYSIO").length,
        ADMIN: users.filter(u => u.role === "ADMIN").length,
    };

    function displayRole(u: UserRow) {
        if (u.role === "ADMIN") return "Admin";
        if (u.role === "PHYSIO") {
            if (u.physioProfile) {
                return DISCIPLINE_LABELS[u.physioProfile.discipline as keyof typeof DISCIPLINE_LABELS] ?? u.physioProfile.discipline;
            }
            return "Professional";
        }
        return "Patient";
    }

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <h1 style={{ font: "700 28px 'Figtree',sans-serif", margin: 0 }}>Users & professionals</h1>
                <div style={{ font: "500 14px 'Figtree',sans-serif", color: "#4f6663" }}>
                    {loading ? "Loading…" : `${users.length} total`}
                </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: "8px", marginTop: "18px", flexWrap: "wrap", alignItems: "center" }}>
                {(["ALL", "PATIENT", "PHYSIO", "ADMIN"] as Filter[]).map(f => (
                    <button
                        key={f}
                        type="button"
                        onClick={() => setFilter(f)}
                        style={{
                            padding: "6px 14px",
                            borderRadius: "20px",
                            border: "1.5px solid",
                            borderColor: filter === f ? "#1b766e" : "#dbe5e2",
                            background: filter === f ? "#1b766e" : "#fff",
                            color: filter === f ? "#fff" : "#4f6663",
                            font: "500 13px 'Figtree',sans-serif",
                            cursor: "pointer",
                        }}
                    >
                        {f === "ALL" ? "All" : f === "PHYSIO" ? "Professionals" : f.charAt(0) + f.slice(1).toLowerCase()}
                        {" "}({counts[f]})
                    </button>
                ))}
                <input
                    type="search"
                    placeholder="Search name or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="in"
                    style={{ marginLeft: "auto", minWidth: "220px", maxWidth: "300px" }}
                />
            </div>

            {/* Table */}
            <div className="card" style={{ marginTop: "20px", padding: 0, overflow: "hidden" }}>
                {loading ? (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", font: "400 14px 'Figtree',sans-serif" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #dbe5e2", background: "#f6f8f7" }}>
                                    {["Name", "Email", "Role / Discipline", "Account", "Licence", "Joined", "Actions"].map(h => (
                                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", font: "600 13px 'Figtree',sans-serif", color: "#4f6663", whiteSpace: "nowrap" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid #eef3f2" }}>
                                        {[180, 220, 100, 70, 80, 90, 110].map((w, j) => (
                                            <td key={j} style={{ padding: "14px 16px" }}>
                                                <div className="skel" style={{ height: "14px", width: `${w}px`, maxWidth: "100%", borderRadius: "6px" }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : visible.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#4f6663", font: "400 14px 'Figtree',sans-serif" }}>
                        No users match your filters.
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", font: "400 14px 'Figtree',sans-serif" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #dbe5e2", background: "#f6f8f7" }}>
                                    {["Name", "Email", "Role / Discipline", "Account", "Licence", "Joined", "Actions"].map(h => (
                                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", font: "600 13px 'Figtree',sans-serif", color: "#4f6663", whiteSpace: "nowrap" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((u, i) => (
                                    <tr key={u.id} style={{ borderBottom: i < visible.length - 1 ? "1px solid #eef3f2" : "none" }}>
                                        <td style={{ padding: "12px 16px", font: "600 14px 'Figtree',sans-serif", color: "#12302c", whiteSpace: "nowrap" }}>
                                            {u.name}
                                        </td>
                                        <td style={{ padding: "12px 16px", color: "#4f6663" }}>
                                            {u.email}
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <span className={ROLE_CHIP[u.role] ?? "chip"} style={{ fontSize: "12px" }}>
                                                {displayRole(u)}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <span className={STATUS_CHIP[u.status] ?? "chip"} style={{ fontSize: "12px" }}>
                                                {u.status.charAt(0) + u.status.slice(1).toLowerCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            {u.physioProfile ? (
                                                <span className={LICENCE_CHIP[u.physioProfile.licenceStatus] ?? "chip"} style={{ fontSize: "12px" }}>
                                                    {u.physioProfile.licenceStatus.charAt(0) + u.physioProfile.licenceStatus.slice(1).toLowerCase()}
                                                </span>
                                            ) : (
                                                <span style={{ color: "#b9c9c5" }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ padding: "12px 16px", color: "#4f6663", whiteSpace: "nowrap" }}>
                                            {new Date(u.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                                        </td>
                                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                                {u.role === "ADMIN" ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn2"
                                                        style={{ minHeight: "30px", fontSize: "12px", color: "#991b1b", borderColor: "#fca5a5" }}
                                                        disabled={promoting === u.id}
                                                        onClick={() => setRole(u.id, "PATIENT")}
                                                    >
                                                        {promoting === u.id ? "…" : "Remove admin"}
                                                    </button>
                                                ) : (
                                                    <>
                                                        {u.role === "PATIENT" && (
                                                            <button
                                                                type="button"
                                                                className="btn btn2"
                                                                style={{ minHeight: "30px", fontSize: "12px", color: "#1b766e", borderColor: "#1b766e" }}
                                                                disabled={promoting === u.id}
                                                                onClick={() => setRole(u.id, "PHYSIO")}
                                                            >
                                                                {promoting === u.id ? "…" : "Set as professional"}
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="btn btn2"
                                                            style={{ minHeight: "30px", fontSize: "12px" }}
                                                            disabled={promoting === u.id}
                                                            onClick={() => setRole(u.id, "ADMIN")}
                                                        >
                                                            {promoting === u.id ? "…" : "Make admin"}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                            {roleErr?.id === u.id && (
                                                <div style={{ font: "400 11px 'Figtree',sans-serif", color: "#991b1b", marginTop: "4px" }}>
                                                    {roleErr.msg}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
