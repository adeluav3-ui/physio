import { z } from "zod";
import { idSchema } from "./common.js";

/** Phrases that warrant showing the patient an emergency safety notice. */
export const RED_FLAG_WORDS = [
    "chest pain",
    "can't breathe",
    "cannot breathe",
    "difficulty breathing",
    "unconscious",
    "stroke",
    "paralysis",
    "can't move",
    "cannot move",
    "loss of consciousness",
    "severe bleeding",
    "head injury",
    "numbness in both",
    "both legs numb",
    "bowel control",
    "bladder control",
    "saddle anaesthesia",
];

export function hasRedFlagWords(text: string): boolean {
    const lower = text.toLowerCase();
    return RED_FLAG_WORDS.some((w) => lower.includes(w));
}

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