import { NextResponse } from "next/server";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
    const { token } = await req.json();
    if (typeof token !== "string") return NextResponse.json({ ok: false }, { status: 400 });
    await setSessionCookie(token);
    return NextResponse.json({ ok: true });
}

export async function DELETE() {
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
}