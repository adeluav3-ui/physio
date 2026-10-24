import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE = "physio_access";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(req: Request) {
    const { code } = await req.json().catch(() => ({ code: "" }));
    const expected = process.env.ACCESS_CODE;

    if (!expected) {
        // No code configured — access is open (dev fallback)
        (await cookies()).set(COOKIE, "1", { httpOnly: true, sameSite: "lax", maxAge: MAX_AGE, secure: process.env.NODE_ENV === "production" });
        return NextResponse.json({ ok: true });
    }

    if (!code || code.trim() !== expected.trim()) {
        return NextResponse.json({ ok: false, error: "Incorrect code" }, { status: 403 });
    }

    (await cookies()).set(COOKIE, "1", { httpOnly: true, sameSite: "lax", maxAge: MAX_AGE, secure: process.env.NODE_ENV === "production" });
    return NextResponse.json({ ok: true });
}
