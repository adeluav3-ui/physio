import { Global, Logger, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { REDIS } from "./redis.constants.js";
import { redisConnectionOptions } from "./redis.options.js";

const logger = new Logger("RedisModule");

@Global()
@Module({
    providers: [
        {
            provide: REDIS,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const url = config.get<string>("REDIS_URL");
                if (!url) throw new Error("REDIS_URL is required");
                return new Redis(url, {
                    ...redisConnectionOptions(url),
                    lazyConnect: true,
                    enableOfflineQueue: false,
                    retryStrategy: (times) => {
                        if (times > 5) {
                            logger.error(
                                `Redis unreachable after ${times} attempts — health check will report redis: "down"`,
                            );
                            return null;
                        }
                        return Math.min(times * 500, 2000);
                    },
                });
            },
        },
    ],
    exports: [REDIS],
})
export class RedisModule {}
