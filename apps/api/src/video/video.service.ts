import { Injectable } from "@nestjs/common";
import { getVideoProvider, type VideoProvider, type VideoRole } from "@physio/video";

/**
 * Thin wrapper around VideoProvider so the rest of the API never touches
 * @physio/video directly. When we swap Daily for in-house, nothing here changes.
 */
@Injectable()
export class VideoService {
    private readonly provider: VideoProvider = getVideoProvider();

    get name() {
        return this.provider.name;
    }

    async createRoom(appointmentId: string) {
        return this.provider.createRoom(appointmentId);
    }

    async issueToken(roomId: string, userId: string, role: VideoRole) {
        return this.provider.issueToken(roomId, userId, role);
    }

    async endRoom(roomId: string) {
        return this.provider.endRoom(roomId);
    }

    roomUrl(roomId: string) {
        const domain = process.env.DAILY_DOMAIN;
        if (!domain) throw new Error("DAILY_DOMAIN missing");
        return `https://${domain}.daily.co/${roomId}`;
    }
}