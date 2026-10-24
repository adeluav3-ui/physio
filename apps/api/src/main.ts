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

function validateConfig(logger: Logger): void {
    const env = process.env["NODE_ENV"];
    const isProduction = env === "production";

    if (isProduction) {
        const jwtSecret = process.env["JWT_SECRET"] ?? "";
        if (jwtSecret.length < 32) {
            logger.error("FATAL: JWT_SECRET must be at least 32 characters in production");
            process.exit(1);
        }
        if (!process.env["DATABASE_URL"]) {
            logger.error("FATAL: DATABASE_URL is required in production");
            process.exit(1);
        }
        if (process.env["PAYSTACK_TEST_BYPASS"]) {
            logger.error("FATAL: PAYSTACK_TEST_BYPASS must not be set in production");
            process.exit(1);
        }
    }

    // Warn on placeholder keys regardless of environment
    const resendKey = process.env["RESEND_API_KEY"] ?? "";
    if (!resendKey || resendKey.startsWith("placeholder") || resendKey === "re_placeholder") {
        logger.warn("RESEND_API_KEY is a placeholder — email delivery disabled");
    }
    const dailyKey = process.env["DAILY_API_KEY"] ?? "";
    if (!dailyKey || dailyKey.startsWith("placeholder")) {
        logger.warn("DAILY_API_KEY is a placeholder — video sessions will return 502");
    }
    const paystackKey = process.env["PAYSTACK_SECRET_KEY"] ?? "";
    if (!paystackKey || paystackKey.startsWith("placeholder") || paystackKey === "sk_test_placeholder") {
        if (process.env["PAYSTACK_TEST_BYPASS"] !== "1") {
            logger.warn("PAYSTACK_SECRET_KEY is a placeholder — payment provider calls will fail");
        }
    }
}

async function bootstrap() {
    const startupLogger = new Logger("Bootstrap");
    validateConfig(startupLogger);

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