import { resolveClientIp } from "../common/client-ip.js";
import { IpEmailThrottlerGuard, IpOnlyThrottlerGuard } from "./throttler-guards.js";

// ── resolveClientIp ──────────────────────────────────────────────────────────

describe("resolveClientIp", () => {
    afterEach(() => {
        delete process.env["PROXY_SHARED_SECRET"];
    });

    it("returns req.ip when PROXY_SHARED_SECRET is not set", () => {
        delete process.env["PROXY_SHARED_SECRET"];
        const req = { ip: "10.0.0.1", headers: { "x-client-ip": "1.2.3.4" } };
        expect(resolveClientIp(req)).toBe("10.0.0.1");
    });

    it("returns X-Client-IP when secret matches", () => {
        process.env["PROXY_SHARED_SECRET"] = "my-secret";
        const req = {
            ip: "10.0.0.1",
            headers: { "x-proxy-secret": "my-secret", "x-client-ip": "5.6.7.8" },
        };
        expect(resolveClientIp(req)).toBe("5.6.7.8");
    });

    it("falls back to req.ip when X-Proxy-Secret is wrong (forged header ignored)", () => {
        process.env["PROXY_SHARED_SECRET"] = "correct-secret";
        const req = {
            ip: "10.0.0.1",
            headers: { "x-proxy-secret": "wrong-secret", "x-client-ip": "9.9.9.9" },
        };
        expect(resolveClientIp(req)).toBe("10.0.0.1");
    });

    it("falls back to req.ip when X-Proxy-Secret header is absent", () => {
        process.env["PROXY_SHARED_SECRET"] = "my-secret";
        const req = { ip: "10.0.0.1", headers: { "x-client-ip": "9.9.9.9" } };
        expect(resolveClientIp(req)).toBe("10.0.0.1");
    });

    it("falls back to socket.remoteAddress when req.ip is absent", () => {
        delete process.env["PROXY_SHARED_SECRET"];
        const req = { socket: { remoteAddress: "192.168.1.1" }, headers: {} };
        expect(resolveClientIp(req)).toBe("192.168.1.1");
    });
});

// ── IpEmailThrottlerGuard.getTracker ─────────────────────────────────────────

describe("IpEmailThrottlerGuard.getTracker — bucket isolation", () => {
    function makeGuard() {
        return Object.create(IpEmailThrottlerGuard.prototype) as IpEmailThrottlerGuard;
    }

    afterEach(() => {
        delete process.env["PROXY_SHARED_SECRET"];
    });

    it("different emails from the same IP produce different keys (separate buckets)", async () => {
        const guard = makeGuard();
        const k1 = await (guard as any).getTracker({ ip: "1.2.3.4", body: { email: "alice@test.com" }, headers: {} });
        const k2 = await (guard as any).getTracker({ ip: "1.2.3.4", body: { email: "bob@test.com" }, headers: {} });
        expect(k1).not.toBe(k2);
    });

    it("same email from different IPs produces different keys (separate buckets)", async () => {
        const guard = makeGuard();
        const k1 = await (guard as any).getTracker({ ip: "1.2.3.4", body: { email: "alice@test.com" }, headers: {} });
        const k2 = await (guard as any).getTracker({ ip: "9.9.9.9", body: { email: "alice@test.com" }, headers: {} });
        expect(k1).not.toBe(k2);
    });

    it("same IP and email always produces the same key (shared bucket)", async () => {
        const guard = makeGuard();
        const req = { ip: "1.2.3.4", body: { email: "alice@test.com" }, headers: {} };
        expect(await (guard as any).getTracker(req)).toBe(await (guard as any).getTracker(req));
    });

    it("normalises email to lowercase so case variants share a bucket", async () => {
        const guard = makeGuard();
        const k1 = await (guard as any).getTracker({ ip: "1.2.3.4", body: { email: "Alice@Test.Com" }, headers: {} });
        const k2 = await (guard as any).getTracker({ ip: "1.2.3.4", body: { email: "alice@test.com" }, headers: {} });
        expect(k1).toBe(k2);
    });

    it("missing email body and undefined body both produce the same fallback key", async () => {
        const guard = makeGuard();
        const k1 = await (guard as any).getTracker({ ip: "1.2.3.4", body: {}, headers: {} });
        const k2 = await (guard as any).getTracker({ ip: "1.2.3.4", body: undefined, headers: {} });
        expect(k1).toBe(k2);
    });

    it("uses X-Client-IP when verified proxy secret matches", async () => {
        process.env["PROXY_SHARED_SECRET"] = "s3cr3t";
        const guard = makeGuard();
        const req = {
            ip: "10.0.0.1",
            body: { email: "u@example.com" },
            headers: { "x-proxy-secret": "s3cr3t", "x-client-ip": "5.5.5.5" },
        };
        expect(await (guard as any).getTracker(req)).toBe("5.5.5.5|u@example.com");
    });
});

// ── IpOnlyThrottlerGuard.getTracker ──────────────────────────────────────────

describe("IpOnlyThrottlerGuard.getTracker — bucket isolation", () => {
    function makeGuard() {
        return Object.create(IpOnlyThrottlerGuard.prototype) as IpOnlyThrottlerGuard;
    }

    afterEach(() => {
        delete process.env["PROXY_SHARED_SECRET"];
    });

    it("two different client IPs get separate buckets", async () => {
        delete process.env["PROXY_SHARED_SECRET"];
        const guard = makeGuard();
        const k1 = await (guard as any).getTracker({ ip: "1.1.1.1", headers: {} });
        const k2 = await (guard as any).getTracker({ ip: "2.2.2.2", headers: {} });
        expect(k1).not.toBe(k2);
    });

    it("ignores email body — same IP gives same key regardless of email", async () => {
        delete process.env["PROXY_SHARED_SECRET"];
        const guard = makeGuard();
        const k1 = await (guard as any).getTracker({ ip: "1.1.1.1", body: { email: "a@x.com" }, headers: {} });
        const k2 = await (guard as any).getTracker({ ip: "1.1.1.1", body: { email: "b@x.com" }, headers: {} });
        expect(k1).toBe(k2);
    });

    it("forged X-Client-IP without correct secret is ignored (falls back to req.ip)", async () => {
        process.env["PROXY_SHARED_SECRET"] = "correct";
        const guard = makeGuard();
        const forgedReq = {
            ip: "10.0.0.1",
            headers: { "x-proxy-secret": "wrong", "x-client-ip": "9.9.9.9" },
        };
        expect(await (guard as any).getTracker(forgedReq)).toBe("10.0.0.1");
    });

    it("legitimate X-Client-IP with correct secret is trusted", async () => {
        process.env["PROXY_SHARED_SECRET"] = "correct";
        const guard = makeGuard();
        const legitReq = {
            ip: "10.0.0.1",
            headers: { "x-proxy-secret": "correct", "x-client-ip": "5.5.5.5" },
        };
        expect(await (guard as any).getTracker(legitReq)).toBe("5.5.5.5");
    });
});
