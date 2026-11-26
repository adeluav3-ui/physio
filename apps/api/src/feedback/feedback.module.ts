import { Module } from "@nestjs/common";
import { FeedbackController } from "./feedback.controller.js";
import { FeedbackService } from "./feedback.service.js";
import { PrismaModule } from "../prisma/prisma.module.js";

@Module({
    imports: [PrismaModule],
    controllers: [FeedbackController],
    providers: [FeedbackService],
    exports: [FeedbackService],
})
export class FeedbackModule {}
