import { BadGatewayException, Injectable, Logger } from "@nestjs/common";
import { getVideoProvider, type VideoProvider, type VideoRole } from "@physio/video";

@Injectable()
export class VideoService {
    private readonly provider: VideoProvider = getVideoProvider();
    private readonly logger = new Logger(VideoService.name);

    get name() {
        return this.provider.name;
    }

    async createRoom(appointmentId: string) {
        try {
            return await this.provider.createRoom(appointmentId);
        } catch (err) {
            this.logger.error(`createRoom failed for appointment ${appointmentId}`, err);
            throw new BadGatewayException({ code: "VIDEO_UNAVAILABLE", message: "Video service is unavailable" });
        }
    }

    async issueToken(roomId: string, userId: string, role: VideoRole) {
        try {
            return await this.provider.issueToken(roomId, userId, role);
        } catch (err) {
            this.logger.error(`issueToken failed for room ${roomId}`, err);
            throw new BadGatewayException({ code: "VIDEO_UNAVAILABLE", message: "Video service is unavailable" });
        }
    }

    async endRoom(roomId: string) {
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
