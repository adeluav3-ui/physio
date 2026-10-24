import { IpEmailThrottlerGuard } from "./throttler-guards.js";

function makeGuardInstance(): IpEmailThrottlerGuard {
    return Object.create(IpEmailThrottlerGuard.prototype) as IpEmailThrottlerGuard;
}

async function track(guard: IpEmailThrottlerGuard, ip: string, email: string): Promise<string> {
    return (guard as any).getTracker({ ip, body: { email } });
}

describe("IpEmailThrottlerGuard.getTracker — bucket isolation", () => {
    it("different emails from the same IP produce different keys (separate buckets)", async () => {
        const guard = makeGuardInstance();
        expect(await track(guard, "1.2.3.4", "alice@test.com")).not.toBe(
            await track(guard, "1.2.3.4", "bob@test.com"),
        );
    });

    it("same email from different IPs produces different keys (separate buckets)", async () => {
        const guard = makeGuardInstance();
        expect(await track(guard, "1.2.3.4", "alice@test.com")).not.toBe(
            await track(guard, "9.9.9.9", "alice@test.com"),
        );
    });

    it("same IP and email always produces the same key (shared bucket)", async () => {
        const guard = makeGuardInstance();
        const k1 = await track(guard, "1.2.3.4", "alice@test.com");
        const k2 = await track(guard, "1.2.3.4", "alice@test.com");
        expect(k1).toBe(k2);
    });

    it("normalises email to lowercase so case variants share a bucket", async () => {
        const guard = makeGuardInstance();
        expect(await track(guard, "1.2.3.4", "Alice@Test.Com")).toBe(
            await track(guard, "1.2.3.4", "alice@test.com"),
        );
    });

    it("missing email body and undefined body both produce the same fallback key", async () => {
        const guard = makeGuardInstance();
        const k1 = await (guard as any).getTracker({ ip: "1.2.3.4", body: {} });
        const k2 = await (guard as any).getTracker({ ip: "1.2.3.4", body: undefined });
        expect(k1).toBe(k2);
    });
});
