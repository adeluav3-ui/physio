import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { resolveClientIp } from "../common/client-ip.js";

/**
 * Keys throttle counters on resolved-client-IP + email.
 * Only processes the "global" named throttler — "ip" is handled by IpOnlyThrottlerGuard.
 */
@Injectable()
export class IpEmailThrottlerGuard extends ThrottlerGuard {
    override async onModuleInit(): Promise<void> {
        await super.onModuleInit();
        // Exclude "ip" throttler — IpOnlyThrottlerGuard owns it
        (this as any).throttlers = ((this as any).throttlers as Array<{ name: string }>).filter(
            (t) => t.name !== "ip",
        );
    }

    protected override async getTracker(req: Record<string, any>): Promise<string> {
        const ip = resolveClientIp(req);
        const email = ((req.body?.email ?? "") as string).toLowerCase().trim();
        return `${ip}|${email}`;
    }
}

/**
 * Keys throttle counters on resolved-client-IP only.
 * Only processes the "ip" named throttler — "global" is handled by IpEmailThrottlerGuard
 * or the default ThrottlerGuard (APP_GUARD).
 */
@Injectable()
export class IpOnlyThrottlerGuard extends ThrottlerGuard {
    override async onModuleInit(): Promise<void> {
        await super.onModuleInit();
        // Keep only "ip" throttler and clear the module-level skipIf so this guard
        // actually enforces it (the module sets skipIf:()=>true to prevent APP_GUARD
        // from applying the ip throttler globally).
        (this as any).throttlers = ((this as any).throttlers as Array<any>)
            .filter((t) => t.name === "ip")
            .map((t) => ({ ...t, skipIf: undefined }));
    }

    protected override async getTracker(req: Record<string, any>): Promise<string> {
        return resolveClientIp(req);
    }
}
