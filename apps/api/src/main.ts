import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { json, urlencoded } from "express";
import type { Request } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module.js";

const BODY_LIMIT = "512kb";

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        bufferLogs: true,
        // Disable auto body-parser so we can configure limit + rawBody capture manually.
        bodyParser: false,
    });

    // Trust exactly 1 proxy hop (the Next.js proxy) so req.ip is the real client IP.
    app.set("trust proxy", 1);

    // JSON body with explicit size limit; capture raw buffer so the Paystack webhook
    // controller can verify the HMAC signature against the original bytes.
    app.use(
        json({
            limit: BODY_LIMIT,
            verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
                req.rawBody = buf;
            },
        }),
    );
    app.use(urlencoded({ extended: true, limit: BODY_LIMIT }));

    const config = app.get(ConfigService);
    const logger = new Logger("Bootstrap");

    app.use(helmet());
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    app.enableCors({
        origin: config.get<string>("APP_URL") ?? "http://localhost:3000",
        credentials: true,
    });
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Graceful shutdown so Prisma/Redis connections close cleanly.
    app.enableShutdownHooks();

    const port = config.get<number>("PORT") ?? 4000;
    await app.listen(port);
    logger.log(`API listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Fatal bootstrap error", err);
    process.exit(1);
});