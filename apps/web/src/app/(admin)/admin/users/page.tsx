import { apiFetch } from "@/lib/api";
import { requireSession } from "@/lib/session";
import { UsersTable } from "./users-table";

export type AdminUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    emailVerifiedAt: string | null;
    physioProfile: { licenceStatus: string; discipline: string } | null;
};

export default async function AdminUsersPage() {
    await requireSession(["ADMIN"]);

    let users: AdminUser[] = [];
    try {
        users = await apiFetch<AdminUser[]>("/admin/users");
    } catch {
        // empty state
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Users</h1>
            <p className="mt-1 text-sm text-text-muted">
                {users.length} registered user{users.length !== 1 ? "s" : ""}.
            </p>
            <UsersTable initialUsers={users} />
        </div>
    );
}
