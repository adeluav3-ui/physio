import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
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
import { GoalPlansModule } from "./goal-plans/goal-plans.module.js";
import { ReferralsModule } from "./referrals/referrals.module.js";
import { AdminModule } from "./admin/admin.module.js";
import { MessagingModule } from "./messaging/messaging.module.js";
import { ReviewsModule } from "./reviews/reviews.module.js";
import { PackagesModule } from "./packages/packages.module.js";
import { WalletModule } from "./wallet/wallet.module.js";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env.local", ".env"] }),
        EventEmitterModule.forRoot(),
        ThrottlerModule.forRoot([
            { name: "global", ttl: 60_000, limit: 100 },
            // "ip" throttler is enforced only by IpOnlyThrottlerGuard on specific routes.
            // skipIf:()=>true prevents the global APP_GUARD from applying it everywhere.
            { name: "ip", ttl: 900_000, limit: 999, skipIf: () => true },
        ]),
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
        GoalPlansModule,
        ReferralsModule,
        AdminModule,
        MessagingModule,
        ReviewsModule,
        PackagesModule,
        WalletModule,
    ],
    providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule { }