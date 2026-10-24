import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

type Ctx = { params: Promise<{ path: string[] }> };

async function forward(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
    const { path } = await ctx.params;
    const upstreamPath = path.join("/");

    // Preserve the query string from the incoming request.
    const search = req.nextUrl.search;
    const upstreamUrl = `${API_URL}/api/${upstreamPath}${search}`;

    const upstreamHeaders = new Headers();

    // Attach auth token from the httpOnly cookie — never read by client code.
    const token = (await cookies()).get("physio_token")?.value;
    if (token) {
        upstreamHeaders.set("Authorization", `Bearer ${token}`);
    }

    // Forward content-type so the API can parse the body correctly.
    const contentType = req.headers.get("content-type");
    if (contentType) {
        upstreamHeaders.set("Content-Type", contentType);
    }

    // Forward the real client IP for server-side rate limiting.
    // In production (Vercel/edge), x-forwarded-for is set by the CDN.
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (clientIp) {
        upstreamHeaders.set("X-Forwarded-For", clientIp);
    }

    // Read body for methods that carry one; pass undefined for GET/HEAD so
    // fetch doesn't send a body at all (which would violate HTTP spec).
    const hasBody = !["GET", "HEAD"].includes(req.method);
    const body = hasBody ? await req.arrayBuffer() : undefined;

    const upstream = await fetch(upstreamUrl, {
        method: req.method,
        headers: upstreamHeaders,
        ...(body !== undefined ? { body: Buffer.from(body) } : {}),
        // Do not follow redirects from the API — pass them through.
        redirect: "manual",
    });

    // Stream the response body back; do not buffer unnecessarily.
    const responseBody = await upstream.arrayBuffer();
    const responseHeaders = new Headers();

    // Forward content-type from the upstream response.
    const upstreamContentType = upstream.headers.get("content-type");
    if (upstreamContentType) {
        responseHeaders.set("Content-Type", upstreamContentType);
    }

    return new NextResponse(responseBody, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders,
    });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
