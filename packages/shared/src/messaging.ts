import { z } from "zod";
import { idSchema } from "./common.js";

export const messageSchema = z.object({
    id: idSchema,
    threadId: idSchema,
    senderId: idSchema,
    body: z.string().min(1).max(4000),
    sentAt: z.string().datetime(),
});
export type Message = z.infer<typeof messageSchema>;

export const sendMessageSchema = z.object({
    threadId: idSchema.optional(), // create if absent
    recipientId: idSchema,
    body: z.string().min(1).max(4000),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;