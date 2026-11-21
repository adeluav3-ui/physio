import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { redisConnectionOptions } from "../redis/redis.options.js";
import { BookingController } from "./booking.controller.js";
import { BookingService } from "./booking.service.js";
import { AvailabilityService } from "./availability.service.js";
import { SlotService } from "./slot.service.js";
import { SlotHoldService, SLOT_HOLD_QUEUE } from "./slot-hold.service.js";
import { SlotHoldProcessor } from "./slot-hold.processor.js";
import { BookingConfirmListener } from "./booking-confirm.listener.js";
import { PaymentsModule } from "../payments/payments.module.js";
import { PatientsModule } from "../patients/patients.module.js";
import { WalletModule } from "../wallet/wallet.module.js";
import { RemindersModule } from "../reminders/reminders.module.js";

@Module({
    imports: [
        PaymentsModule,
        PatientsModule,
        WalletModule,
        RemindersModule,
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const url = config.getOrThrow<string>("REDIS_URL");
                return { connection: { url, ...redisConnectionOptions(url) } };
            },
        }),
        BullModule.registerQueue({ name: SLOT_HOLD_QUEUE }),
    ],
    controllers: [BookingController],
    providers: [
        BookingService,
        AvailabilityService,
        SlotService,
        SlotHoldService,
        SlotHoldProcessor,
        BookingConfirmListener,
    ],
    exports: [BookingService, SlotHoldService],
})
export class BookingModule { }