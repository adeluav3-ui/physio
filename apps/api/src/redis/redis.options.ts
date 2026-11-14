import type { RedisOptions } from "ioredis";

export function redisConnectionOptions(url: string): RedisOptions {
    return {
        lazyConnect: true,
        connectTimeout: 5000,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        ...(url.startsWith("rediss://") && { tls: { rejectUnauthorized: false } }),
        retryStrategy: (times) => {
            if (times > 5) return null;
            return Math.min(times * 500, 2000);
        },
    };
}
