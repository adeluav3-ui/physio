export type VideoRole = "PATIENT" | "PHYSIO" | "OBSERVER";

export type Room = {
    id: string;        // provider room id
    url?: string;      // provider join URL (optional)
    createdAt: string; // ISO
    expiresAt: string; // ISO
};

export type Token = {
    token: string;
    expiresAt: string; // ISO
};

export type QualityMetrics = {
    joinSuccess?: boolean;
    timeToFirstFrameMs?: number;
    dropCount?: number;
    reconnectionMs?: number;
    averageBitrateKbps?: number;
    raw?: Record<string, unknown>;
};

export interface VideoProvider {
    readonly name: "DAILY" | "IN_HOUSE";

    createRoom(appointmentId: string, endsAt?: string): Promise<Room>;
    issueToken(roomId: string, userId: string, role: VideoRole): Promise<Token>;
    endRoom(roomId: string): Promise<void>;
    verifyRoom(roomId: string): Promise<boolean>;
    getMetrics(roomId: string): Promise<QualityMetrics>;
    startRecording(roomId: string): Promise<void>;
    stopRecording(roomId: string): Promise<void>;
}