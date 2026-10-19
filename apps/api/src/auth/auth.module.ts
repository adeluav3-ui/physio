import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { TokenService } from "./token.service.js";
import { JwtStrategy } from "./jwt.strategy.js";
import { RolesGuard } from "./roles.guard.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.getOrThrow<string>("JWT_SECRET"),
                signOptions: {
                    expiresIn: config.get<string>("JWT_EXPIRES_IN") ?? "7d",
                },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, TokenService, JwtStrategy, RolesGuard, JwtAuthGuard],
    exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule { }