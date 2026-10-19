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

    async createRoom(appointmentId: string): Promise<Room> {
        const expirySeconds = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
        const data = await this.call<{ id: string; url: string; created_at: string; config: { exp: number } }>(
            "/rooms",
            {
                method: "POST",
                body: JSON.stringify({
                    name: `appt-${appointmentId}`,
                    properties: {
                        exp: expirySeconds,
                        enable_chat: false,
                        enable_screenshare: false,
                        start_video_off: false,
                        start_audio_off: false,
                        eject_at_room_exp: true,
                    },
                }),
            },
        );
        return {
            id: data.id,
            url: data.url,
            createdAt: new Date(data.created_at).toISOString(),
            expiresAt: new Date(data.config.exp * 1000).toISOString(),
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