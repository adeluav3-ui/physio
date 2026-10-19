export type { VideoProvider, Room, Token, QualityMetrics, VideoRole } from "./types.js";
export { DailyProvider } from "./daily.js";
export { InHouseProvider } from "./in-house.js";

import { DailyProvider } from "./daily.js";
import { InHouseProvider } from "./in-house.js";
import type { VideoProvider } from "./types.js";

export function getVideoProvider(): VideoProvider {
    const kind = (process.env.VIDEO_PROVIDER ?? "DAILY").toUpperCase();
    if (kind === "IN_HOUSE") return new InHouseProvider();
    const key = process.env.DAILY_API_KEY;
    if (!key) throw new Error("DAILY_API_KEY missing");
    return new DailyProvider(key);
}