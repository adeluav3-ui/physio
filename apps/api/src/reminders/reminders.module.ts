import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
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
            useFactory: (config: ConfigService) => ({
                connection: {
                    url: config.getOrThrow<string>("REDIS_URL"),
                    lazyConnect: true,
                    connectTimeout: 3000,
                    retryStrategy: (times: number) => {
                        if (times > 5) return null;
                        return Math.min(times * 500, 2000);
                    },
                },
            }),
        }),
        BullModule.registerQueue({ name: REMINDERS_QUEUE }),
        PaymentsModule,
        ReferralsModule,
    ],
    providers: [RemindersService, RemindersProcessor, RemindersScheduler],
    exports: [RemindersService],
})
export class RemindersModule {}
