import type { RedisOptions } from "ioredis";

/** Options for BullMQ connections — retries indefinitely so the app never crashes when Redis is slow/unavailable. */
export function redisConnectionOptions(url: string): RedisOptions {
    return {
        maxRetriesPerRequest: null,
        connectTimeout: 10000,
        ...(url.startsWith("rediss://") && { tls: { rejectUnauthorized: false } }),
        retryStrategy: (times) => Math.min(times * 500, 30_000),
    };
}
