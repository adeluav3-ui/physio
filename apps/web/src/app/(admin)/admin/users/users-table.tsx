"use client";

import { useState } from "react";
import { Card } from "@physio/ui";

type AdminUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    emailVerifiedAt: string | null;
    physioProfile: { licenceStatus: string; discipline: string } | null;
};

export function UsersTable({ initialUsers }: { initialUsers: AdminUser[] }) {
    const [users, setUsers] = useState<AdminUser[]>(initialUsers);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function refetch() {
        try {
            const res = await fetch("/api/proxy/admin/users");
            if (res.ok) {
                const fresh = (await res.json()) as AdminUser[];
                setUsers(fresh);
            }
        } catch {
            // ignore refetch errors — stale data is better than a crash
        }
    }

    async function setStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
        setBusy(id + status);
        setError(null);
        try {
            const res = await fetch(`/api/proxy/admin/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((body as { message?: string }).message ?? res.statusText);
            }
            await refetch();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setBusy(null);
        }
    }

    async function deleteUser(id: string) {
        if (!window.confirm("Delete this user? This cannot be undone.")) return;
        setBusy(id + "DELETE");
        setError(null);
        try {
            const res = await fetch(`/api/proxy/admin/users/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((body as { message?: string }).message ?? res.statusText);
            }
            await refetch();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setBusy(null);
        }
    }

    return (
        <>
            {error && (
                <div className="mt-4 rounded-md bg-[#fde8e8] px-4 py-2 text-sm text-[#8f1d1d]">
                    {error}
                </div>
            )}

            <Card padding="none" className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-text-muted">
                        <tr>
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Email</th>
                            <th className="px-4 py-2">Role</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Verified email</th>
                            <th className="px-4 py-2">Joined</th>
                            <th className="px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => {
                            const isSuspended = u.status === "SUSPENDED";
                            const isAdmin = u.role === "ADMIN";
                            const rowBusy = busy?.startsWith(u.id) ?? false;

                            return (
                                <tr
                                    key={u.id}
                                    className={`border-t border-border ${isSuspended ? "opacity-50" : ""}`}
                                >
                                    <td
                                        className={`px-4 py-2 font-medium ${isSuspended ? "line-through" : ""}`}
                                    >
                                        {u.name}
                                    </td>
                                    <td className="px-4 py-2 text-xs text-text-muted">{u.email}</td>
                                    <td className="px-4 py-2">
                                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium">
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                isSuspended
                                                    ? "bg-[#fde8e8] text-[#8f1d1d]"
                                                    : "bg-[#e3f4e8] text-[#1d5c34]"
                                            }`}
                                        >
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs">
                                        {u.emailVerifiedAt ? "Yes" : "No"}
                                    </td>
                                    <td className="px-4 py-2 text-xs text-text-muted">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-2">
                                        {!isAdmin && (
                                            <div className="flex items-center gap-2">
                                                {isSuspended ? (
                                                    <button
                                                        disabled={rowBusy}
                                                        onClick={() => setStatus(u.id, "ACTIVE")}
                                                        className="rounded bg-[#e3f4e8] px-2 py-0.5 text-xs font-medium text-[#1d5c34] hover:bg-[#c5e9d0] disabled:opacity-50"
                                                    >
                                                        Activate
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled={rowBusy}
                                                        onClick={() => setStatus(u.id, "SUSPENDED")}
                                                        className="rounded bg-[#fdf1d8] px-2 py-0.5 text-xs font-medium text-[#7a4f00] hover:bg-[#f9e0a8] disabled:opacity-50"
                                                    >
                                                        Suspend
                                                    </button>
                                                )}
                                                <button
                                                    disabled={rowBusy}
                                                    onClick={() => deleteUser(u.id)}
                                                    className="rounded bg-[#fde8e8] px-2 py-0.5 text-xs font-medium text-[#8f1d1d] hover:bg-[#f9c5c5] disabled:opacity-50"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                                    No users yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </>
    );
}
