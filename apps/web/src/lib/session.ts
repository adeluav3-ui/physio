import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, SessionUser } from "@physio/shared";
import { apiFetch } from "./api";

export async function getSession(): Promise<SessionUser | null> {
    const token = (await cookies()).get("physio_token")?.value;
    if (!token) return null;
    try {
        return await apiFetch<SessionUser>("/auth/me", { token });
    } catch {
        return null;
    }
}

export async function requireSession(roles?: Role[]): Promise<SessionUser> {
    const user = await getSession();
    if (!user) redirect("/auth/login");
    if (roles && !roles.includes(user.role)) redirect("/");
    return user;
}

export async function setSessionCookie(token: string) {
    (await cookies()).set("physio_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });
}

export async function clearSessionCookie() {
    (await cookies()).delete("physio_token");
}