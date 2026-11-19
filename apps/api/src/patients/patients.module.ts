import { Module } from "@nestjs/common";
import { PatientsController } from "./patients.controller.js";
import { PatientsService } from "./patients.service.js";
import { AuditModule } from "../audit/audit.module.js";

@Module({
    imports: [AuditModule],
    controllers: [PatientsController],
    providers: [PatientsService],
    exports: [PatientsService],
})
export class PatientsModule { }