import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { sessionNoteSchema, type SessionNoteInput, type SessionUser } from "@physio/shared";
import { SessionsService } from "./sessions.service.js";
import { SessionNotesService } from "./session-notes.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../auth/roles.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodBody } from "../common/zod-validation.pipe.js";

@Controller("sessions")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
    constructor(
        private readonly sessions: SessionsService,
        private readonly notes: SessionNotesService,
    ) { }

    @Post(":appointmentId/join")
    join(@CurrentUser() user: SessionUser, @Param("appointmentId") appointmentId: string) {
        return this.sessions.join(user, appointmentId);
    }

    @Post(":appointmentId/end")
    end(
        @CurrentUser() user: SessionUser,
        @Param("appointmentId") appointmentId: string,
        @Body() body: { quality?: Record<string, unknown> },
    ) {
        return this.sessions.end(user, appointmentId, body.quality);
    }

    @Get(":appointmentId")
    getForCaller(@CurrentUser() user: SessionUser, @Param("appointmentId") appointmentId: string) {
        return this.sessions.getForCaller(user, appointmentId);
    }

    @Post("notes")
    @Roles("PHYSIO", "ADMIN")
    upsertNote(@CurrentUser() user: SessionUser, @Body(new ZodBody(sessionNoteSchema)) body: SessionNoteInput) {
        return this.notes.upsert(user, body);
    }

    @Get(":appointmentId/notes")
    getNote(@CurrentUser() user: SessionUser, @Param("appointmentId") appointmentId: string) {
        return this.notes.get(user, appointmentId);
    }

    @Post(":appointmentId/notes/sign")
    @Roles("PHYSIO", "ADMIN")
    signNote(@CurrentUser() user: SessionUser, @Param("appointmentId") appointmentId: string) {
        return this.notes.sign(user, appointmentId);
    }

    @Post(":appointmentId/notes/addendum")
    @Roles("PHYSIO", "ADMIN")
    addAddendum(
        @CurrentUser() user: SessionUser,
        @Param("appointmentId") appointmentId: string,
        @Body() body: { body: string },
    ) {
        return this.notes.addAddendum(user, appointmentId, body.body);
    }

    @Post(":appointmentId/patient-summary")
    @Roles("PHYSIO", "ADMIN")
    upsertSummary(
        @CurrentUser() user: SessionUser,
        @Param("appointmentId") appointmentId: string,
        @Body() body: { body: string },
    ) {
        return this.notes.upsertSummary(user, appointmentId, body.body);
    }

    @Post(":appointmentId/patient-summary/approve")
    @Roles("PHYSIO", "ADMIN")
    approveSummary(@CurrentUser() user: SessionUser, @Param("appointmentId") appointmentId: string) {
        return this.notes.approveSummary(user, appointmentId);
    }

    @Get(":appointmentId/patient-summary")
    getSummary(@CurrentUser() user: SessionUser, @Param("appointmentId") appointmentId: string) {
        return this.notes.getSummary(user, appointmentId);
    }
}
