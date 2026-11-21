import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service.js";
import { PaymentsController } from "./payments.controller.js";
import { PaystackWebhookController } from "./paystack-webhook.controller.js";
import { PaymentsAdminController } from "./payments-admin.controller.js";

@Module({
    imports: [],
    providers: [PaymentsService],
    controllers: [PaymentsController, PaystackWebhookController, PaymentsAdminController],
    exports: [PaymentsService],
})
export class PaymentsModule { }