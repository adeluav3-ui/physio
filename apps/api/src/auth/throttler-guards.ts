import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class IpEmailThrottlerGuard extends ThrottlerGuard {
    protected override async getTracker(req: Record<string, any>): Promise<string> {
        const ip = (req.ip ?? req.socket?.remoteAddress ?? "unknown") as string;
        const email = ((req.body?.email ?? "") as string).toLowerCase().trim();
        return `${ip}|${email}`;
    }
}
