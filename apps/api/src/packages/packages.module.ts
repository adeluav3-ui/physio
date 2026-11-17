import { Module } from "@nestjs/common";
import { PackagesController } from "./packages.controller.js";
import { PackagesService } from "./packages.service.js";
import { PrismaModule } from "../prisma/prisma.module.js";

@Module({
    imports: [PrismaModule],
    controllers: [PackagesController],
    providers: [PackagesService],
    exports: [PackagesService],
})
export class PackagesModule {}
