import type { Room, Token, QualityMetrics, VideoProvider, VideoRole } from "./types.js";

/**
 * Placeholder for the LiveKit-backed in-house stack (Phase A/B in the plan).
 * Kept behind the VideoProvider interface so call sites never change when we cut over.
 */
export class InHouseProvider implements VideoProvider {
    readonly name = "IN_HOUSE" as const;

    async createRoom(_appointmentId: string): Promise<Room> {
        throw new Error("InHouseProvider not implemented yet");
    }
    async issueToken(_roomId: string, _userId: string, _role: VideoRole): Promise<Token> {
        throw new Error("InHouseProvider not implemented yet");
    }
    async endRoom(_roomId: string): Promise<void> {
        throw new Error("InHouseProvider not implemented yet");
    }
    async getMetrics(_roomId: string): Promise<QualityMetrics> {
        throw new Error("InHouseProvider not implemented yet");
    }
    async startRecording(_roomId: string): Promise<void> {
        throw new Error("InHouseProvider not implemented yet");
    }
    async stopRecording(_roomId: string): Promise<void> {
        throw new Error("InHouseProvider not implemented yet");
    }
}