import { Module } from "@nestjs/common";
import { SessionsController } from "./sessions.controller.js";
import { SessionsService } from "./sessions.service.js";
import { SessionNotesService } from "./session-notes.service.js";
import { VideoModule } from "../video/video.module.js";
import { ProgramsModule } from "../programs/programs.module.js";

@Module({
    imports: [VideoModule, ProgramsModule],
    controllers: [SessionsController],
    providers: [SessionsService, SessionNotesService],
    exports: [SessionsService],
})
export class SessionsModule { }