import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { redisConnectionOptions } from "../redis/redis.options.js";
import { RemindersService } from "./reminders.service.js";
import { RemindersProcessor } from "./reminders.processor.js";
import { RemindersScheduler } from "./reminders.scheduler.js";
import { REMINDERS_QUEUE } from "./reminders.constants.js";
import { PaymentsModule } from "../payments/payments.module.js";
import { ReferralsModule } from "../referrals/referrals.module.js";

@Module({
    imports: [
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const url = config.getOrThrow<string>("REDIS_URL");
                return { connection: { url, ...redisConnectionOptions(url) } };
            },
        }),
        BullModule.registerQueue({ name: REMINDERS_QUEUE }),
        PaymentsModule,
        ReferralsModule,
    ],
    providers: [RemindersService, RemindersProcessor, RemindersScheduler],
    exports: [RemindersService],
})
export class RemindersModule {}
