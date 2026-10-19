import { Module } from "@nestjs/common";
import { PhysioController } from "./physio.controller.js";
import { PhysioService } from "./physio.service.js";

@Module({
    controllers: [PhysioController],
    providers: [PhysioService],
    exports: [PhysioService],
})
export class PhysioModule { }