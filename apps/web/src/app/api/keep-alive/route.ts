import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

/** Called by Vercel cron every 10 minutes to prevent Render cold starts. */
export async function GET() {
    try {
        await fetch(`${API_URL}/api/health`, {
            next: { revalidate: 0 },
            signal: AbortSignal.timeout(8000),
        });
    } catch {
        // Ignore — the point is just to keep the container warm.
    }
    return NextResponse.json({ ok: true });
}
