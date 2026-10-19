import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { SessionUser } from "@physio/shared";

export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): SessionUser => {
        const req = ctx.switchToHttp().getRequest();
        return req.user;
    },
);