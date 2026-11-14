import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { BookingController } from "./booking.controller.js";
import { BookingService } from "./booking.service.js";
import { AvailabilityService } from "./availability.service.js";
import { SlotService } from "./slot.service.js";
import { SlotHoldService, SLOT_HOLD_QUEUE } from "./slot-hold.service.js";
import { SlotHoldProcessor } from "./slot-hold.processor.js";
import { BookingConfirmListener } from "./booking-confirm.listener.js";
import { PaymentsModule } from "../payments/payments.module.js";
import { PatientsModule } from "../patients/patients.module.js";

@Module({
    imports: [
        PaymentsModule,
        PatientsModule,
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