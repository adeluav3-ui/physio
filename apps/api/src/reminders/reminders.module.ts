import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { RemindersService } from "./reminders.service.js";
import { RemindersProcessor } from "./reminders.processor.js";
import { RemindersScheduler } from "./reminders.scheduler.js";
import { REMINDERS_QUEUE } from "./reminders.constants.js";

@Module({
    imports: [
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: { url: config.getOrThrow<string>("REDIS_URL") },
            }),
        }),
        BullModule.registerQueue({ name: REMINDERS_QUEUE }),
    ],
    providers: [RemindersService, RemindersProcessor, RemindersScheduler],
    exports: [RemindersService],
})
export class RemindersModule { }