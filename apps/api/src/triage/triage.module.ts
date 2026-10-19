import { Module } from "@nestjs/common";
import { TriageController } from "./triage.controller.js";
import { TriageService } from "./triage.service.js";

@Module({
    controllers: [TriageController],
    providers: [TriageService],
    exports: [TriageService],
})
export class TriageModule { }