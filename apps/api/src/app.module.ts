import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { PrismaModule } from "./prisma/prisma.module.js";
import { RedisModule } from "./redis/redis.module.js";
import { MailModule } from "./mail/mail.module.js";
import { AuditModule } from "./audit/audit.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { TriageModule } from "./triage/triage.module.js";
import { HealthModule } from "./health/health.module.js";
import { BookingModule } from "./booking/booking.module.js";
import { PaymentsModule } from "./payments/payments.module.js";
import { PhysioModule } from "./physio/physio.module.js";
import { NotificationsModule } from "./notifications/notifications.module.js";
import { SessionsModule } from "./sessions/sessions.module.js";
import { VideoModule } from "./video/video.module.js";
import { ProgramsModule } from "./programs/programs.module.js";
import { RemindersModule } from "./reminders/reminders.module.js";
import { PatientsModule } from "./patients/patients.module.js";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env.local", ".env"] }),
        EventEmitterModule.forRoot(),
        PrismaModule,
        RedisModule,
        MailModule,
        AuditModule,
        AuthModule,
        TriageModule,
        HealthModule,
        PhysioModule,
        PaymentsModule,
        BookingModule,
        NotificationsModule,
        VideoModule,
        SessionsModule,
        ProgramsModule,
        RemindersModule,
        PatientsModule,
    ],
})
export class AppModule { }