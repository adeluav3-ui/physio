import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import type { SessionUser } from "@physio/shared";
import { MessagingService } from "./messaging.service.js";
import { z } from "zod";
import { idSchema } from "@physio/shared";

const getOrCreateThreadSchema = z.object({ recipientId: idSchema });
const sendMessageSchema = z.object({ body: z.string().min(1).max(4000) });

@UseGuards(JwtAuthGuard)
@Controller("threads")
export class MessagingController {
    constructor(private readonly messaging: MessagingService) {}

    @Post()
    async getOrCreate(@CurrentUser() user: SessionUser, @Body() body: unknown) {
        const { recipientId } = getOrCreateThreadSchema.parse(body);
        return this.messaging.getOrCreateThread(user, recipientId);
    }

    @Get()
    async list(@CurrentUser() user: SessionUser) {
        return this.messaging.listThreads(user);
    }

    @Get(":id/messages")
    async listMessages(@CurrentUser() user: SessionUser, @Param("id") threadId: string) {
        return this.messaging.listMessages(user, threadId);
    }

    @Post(":id/messages")
    async send(
        @CurrentUser() user: SessionUser,
        @Param("id") threadId: string,
        @Body() body: unknown,
    ) {
        const { body: text } = sendMessageSchema.parse(body);
        return this.messaging.sendMessage(user, threadId, text);
    }
}
