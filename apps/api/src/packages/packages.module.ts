import { Module } from "@nestjs/common";
import { PackagesController } from "./packages.controller.js";
import { PackagesService } from "./packages.service.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { PaymentsModule } from "../payments/payments.module.js";
import { WalletModule } from "../wallet/wallet.module.js";

@Module({
    imports: [PrismaModule, PaymentsModule, WalletModule],
    controllers: [PackagesController],
    providers: [PackagesService],
    exports: [PackagesService],
})
export class PackagesModule {}
