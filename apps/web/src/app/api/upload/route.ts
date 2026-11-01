import { put } from "@vercel/blob";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ALLOWED_TYPES = [
    "image/jpeg", "image/png", "image/webp",
    "application/pdf",
];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(req: Request) {
    // Require an active session
    const token = (await cookies()).get("physio_token")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
        return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ message: "File type not allowed. Use JPG, PNG, WEBP or PDF." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
        return NextResponse.json({ message: "File too large. Maximum size is 8 MB." }, { status: 400 });
    }

    let blob;
    try {
        blob = await put(file.name, file, { access: "public", addRandomSuffix: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        return NextResponse.json({ message: msg }, { status: 500 });
    }

    return NextResponse.json({ url: blob.url });
}
