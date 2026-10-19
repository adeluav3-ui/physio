import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service.js";

type JwtPayload = { sub: string; role: string; email: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
    constructor(config: ConfigService, private readonly auth: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.getOrThrow<string>("JWT_SECRET"),
        });
    }

    async validate(payload: JwtPayload) {
        try {
            return await this.auth.getSession(payload.sub);
        } catch {
            throw new UnauthorizedException({ code: "INVALID_SESSION", message: "Session expired" });
        }
    }
}