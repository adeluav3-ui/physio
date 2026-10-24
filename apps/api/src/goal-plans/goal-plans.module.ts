import { Module } from "@nestjs/common";
import { GoalPlansController } from "./goal-plans.controller.js";
import { GoalPlansService } from "./goal-plans.service.js";
import { PrismaModule } from "../prisma/prisma.module.js";

@Module({
    imports: [PrismaModule],
    controllers: [GoalPlansController],
    providers: [GoalPlansService],
    exports: [GoalPlansService],
})
export class GoalPlansModule {}
