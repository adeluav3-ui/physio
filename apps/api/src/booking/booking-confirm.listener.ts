import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { BookingService } from "./booking.service.js";

@Injectable()
export class BookingConfirmListener {
    constructor(private readonly booking: BookingService) { }

    @OnEvent("payment.succeeded")
    async handle(payload: { appointmentId: string; reference: string }) {
        await this.booking.confirmAfterPayment(payload.appointmentId, payload.reference);
    }
}