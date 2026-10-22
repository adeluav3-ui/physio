import { Module } from "@nestjs/common";
import { BookingController } from "./booking.controller.js";
import { BookingService } from "./booking.service.js";
import { AvailabilityService } from "./availability.service.js";
import { SlotService } from "./slot.service.js";
import { BookingConfirmListener } from "./booking-confirm.listener.js";
import { PaymentsModule } from "../payments/payments.module.js";
import { PatientsModule } from "../patients/patients.module.js";

@Module({
    imports: [PaymentsModule, PatientsModule],
    controllers: [BookingController],
    providers: [BookingService, AvailabilityService, SlotService, BookingConfirmListener],
    exports: [BookingService],
})
export class BookingModule { }