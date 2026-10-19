import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { REDIS } from "./redis.constants.js";

@Global()
@Module({
    providers: [
        {
            provide: REDIS,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const url = config.get<string>("REDIS_URL");
                if (!url) throw new Error("REDIS_URL is required");
                return new Redis(url, { maxRetriesPerRequest: null });
            },
        },
    ],
    exports: [REDIS],
})
export class RedisModule { }