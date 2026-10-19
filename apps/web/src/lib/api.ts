import { cookies } from "next/headers";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: string,
        message: string,
        public readonly details?: unknown,
    ) {
        super(message);
    }
}

export async function apiFetch<T>(
    path: string,
    init?: RequestInit & { token?: string },
): Promise<T> {
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");

    const token = init?.token ?? (await cookies()).get("physio_token")?.value;
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API_URL}/api${path}`, { ...init, headers });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(
            res.status,
            body.code ?? "UNKNOWN",
            body.message ?? res.statusText,
            body.details,
        );
    }
    return (await res.json()) as T;
}