import { Module } from "@nestjs/common";
import { VideoService } from "./video.service.js";

@Module({
    providers: [VideoService],
    exports: [VideoService],
})
export class VideoModule { }