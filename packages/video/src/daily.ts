import { VIDEO_ROOM_GRACE_MIN } from "@physio/shared";
import type { Room, Token, QualityMetrics, VideoProvider, VideoRole } from "./types.js";

const DAILY_API = "https://api.daily.co/v1";

export class DailyProvider implements VideoProvider {
    readonly name = "DAILY" as const;

    constructor(private readonly apiKey: string) {
        if (!apiKey) throw new Error("DAILY_API_KEY is required");
    }

    private async call<T>(path: string, init?: RequestInit): Promise<T> {
        const res = await fetch(`${DAILY_API}${path}`, {
            ...init,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
                ...(init?.headers ?? {}),
            },
        });
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Daily ${path} failed: ${res.status} ${text}`);
        }
        return (await res.json()) as T;
    }

    async verifyRoom(roomId: string): Promise<boolean> {
        try {
            await this.call(`/rooms/${roomId}`);
            return true;
        } catch {
            return false;
        }
    }

    async createRoom(appointmentId: string, endsAt?: string): Promise<Room> {
        const name = `appt-${appointmentId}`;
        // Use the session's scheduled end time + grace period instead of a
        // blanket 6-hour window, so rooms cannot linger and rack up Daily minutes.
        const baseMs = endsAt ? new Date(endsAt).getTime() : Date.now() + 60 * 60 * 1000;
        const expirySeconds = Math.floor(baseMs / 1000) + VIDEO_ROOM_GRACE_MIN * 60;

        type DailyRoom = { id: string; url: string; created_at: string | number; config?: { exp?: number } };

        let room: DailyRoom;
        try {
            room = await this.call<DailyRoom>("/rooms", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    properties: {
                        exp: expirySeconds,
                        enable_chat: false,
                        enable_screenshare: false,
                        start_video_off: false,
                        start_audio_off: false,
                        eject_at_room_exp: true,
                        enable_recording: "none",
                        enable_recording_ui: false,
                    },
                }),
            });
        } catch (e) {
            // Room already exists (e.g. verifyRoom ran against a stale DB UUID
            // rather than the name, failed, and triggered a redundant createRoom).
            // Fetch the existing room instead of crashing.
            if ((e as Error).message?.includes("already exists")) {
                room = await this.call<DailyRoom>(`/rooms/${name}`);
            } else {
                throw e;
            }
        }

        const exp = room.config?.exp ?? expirySeconds;
        const rawCreatedAt = room.created_at;
        const createdAt = typeof rawCreatedAt === "number"
            ? new Date(rawCreatedAt * 1000).toISOString()
            : new Date(rawCreatedAt).toISOString();

        return {
            // Use the room NAME as the identifier — Daily routes all subsequent
            // operations (GET/DELETE/issueToken) by name, not by its internal UUID.
            id: name,
            url: room.url,
            createdAt,
            expiresAt: new Date(exp * 1000).toISOString(),
        };
    }

    async issueToken(roomId: string, userId: string, role: VideoRole): Promise<Token> {
        const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
        const data = await this.call<{ token: string }>("/meeting-tokens", {
            method: "POST",
            body: JSON.stringify({
                properties: {
                    room_name: roomId,
                    user_id: userId,
                    is_owner: role === "PHYSIO",
                    exp,
                },
            }),
        });
        return { token: data.token, expiresAt: new Date(exp * 1000).toISOString() };
    }

    async endRoom(roomId: string): Promise<void> {
        await this.call(`/rooms/${roomId}`, { method: "DELETE" });
    }

    async getMetrics(roomId: string): Promise<QualityMetrics> {
        // Daily exposes per-participant metrics via the room; aggregate at call site.
        const data = await this.call<{ data?: unknown[] }>(`/meetings/${roomId}`);
        return { raw: { data: data.data ?? [] } };
    }

    async startRecording(roomId: string): Promise<void> {
        await this.call(`/rooms/${roomId}/recordings/start`, { method: "POST" });
    }

    async stopRecording(roomId: string): Promise<void> {
        await this.call(`/rooms/${roomId}/recordings/stop`, { method: "POST" });
    }
}