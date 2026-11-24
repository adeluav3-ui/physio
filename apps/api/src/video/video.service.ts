import { BadGatewayException, Injectable, Logger } from "@nestjs/common";
import { getVideoProvider, type VideoProvider, type VideoRole } from "@physio/video";

@Injectable()
export class VideoService {
    private readonly provider: VideoProvider | null;
    private readonly logger = new Logger(VideoService.name);

    constructor() {
        try {
            this.provider = getVideoProvider();
        } catch {
            this.provider = null;
            this.logger.warn("DAILY_API_KEY is not set — video sessions will return 502");
        }
    }

    private get safeProvider(): VideoProvider {
        if (!this.provider) throw new BadGatewayException({ code: "VIDEO_UNAVAILABLE", message: "Video service is unavailable" });
        return this.provider;
    }

    get name() {
        return this.safeProvider.name;
    }

    async createRoom(appointmentId: string, endsAt?: string) {
        try {
            return await this.safeProvider.createRoom(appointmentId, endsAt);
        } catch (err) {
            if (err instanceof BadGatewayException) throw err;
            this.logger.error(`createRoom failed for appointment ${appointmentId}`, err);
            throw new BadGatewayException({ code: "VIDEO_UNAVAILABLE", message: "Video service is unavailable" });
        }
    }

    async issueToken(roomId: string, userId: string, role: VideoRole) {
        try {
            return await this.safeProvider.issueToken(roomId, userId, role);
        } catch (err) {
            if (err instanceof BadGatewayException) throw err;
            this.logger.error(`issueToken failed for room ${roomId}`, err);
            throw new BadGatewayException({ code: "VIDEO_UNAVAILABLE", message: "Video service is unavailable" });
        }
    }

    async verifyRoom(roomId: string): Promise<boolean> {
        if (!this.provider) return false;
        try {
            return await this.provider.verifyRoom(roomId);
        } catch {
            return true; // fail open — don't break join on a transient network hiccup
        }
    }

    async endRoom(roomId: string) {
        if (!this.provider) return;
        try {
            await this.provider.endRoom(roomId);
        } catch (err) {
            // Non-fatal: room may have already expired; log but do not surface to caller.
            this.logger.warn(`endRoom failed for room ${roomId}`, err);
        }
    }

    roomUrl(roomId: string) {
        const domain = process.env.DAILY_DOMAIN;
        if (!domain) throw new BadGatewayException({ code: "VIDEO_UNAVAILABLE", message: "Video service is unavailable" });
        return `https://${domain}.daily.co/${roomId}`;
    }
}
