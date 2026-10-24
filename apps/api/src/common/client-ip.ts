import { timingSafeEqual, createHash } from "node:crypto";

function constantTimeEqual(a: string, b: string): boolean {
    const ha = createHash("sha256").update(a).digest();
    const hb = createHash("sha256").update(b).digest();
    return timingSafeEqual(ha, hb);
}

/**
 * Returns the verified real client IP.
 *
 * When PROXY_SHARED_SECRET is configured, trust X-Client-IP only when the
 * incoming X-Proxy-Secret matches (constant-time compare). Otherwise fall
 * back to req.ip (which Express sets from X-Forwarded-For via trust proxy 1).
 */
export function resolveClientIp(req: Record<string, any>): string {
    const secret = process.env["PROXY_SHARED_SECRET"];
    if (secret) {
        const incoming = ((req.headers?.["x-proxy-secret"] as string | undefined) ?? "").trim();
        if (incoming && constantTimeEqual(incoming, secret)) {
            const ip = ((req.headers?.["x-client-ip"] as string | undefined) ?? "").trim();
            if (ip) return ip;
        }
    }
    return (req.ip ?? req.socket?.remoteAddress ?? "unknown") as string;
}
