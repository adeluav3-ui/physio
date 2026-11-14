import type { RedisOptions } from "ioredis";

/** Options shared by all Redis/BullMQ connections. */
export function redisConnectionOptions(url: string): RedisOptions {
    return {
        maxRetriesPerRequest: null,
        connectTimeout: 5000,
        ...(url.startsWith("rediss://") && { tls: { rejectUnauthorized: false } }),
        retryStrategy: (times) => {
            if (times > 5) return null;
            return Math.min(times * 500, 2000);
        },
    };
}
