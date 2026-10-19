import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module.js";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bufferLogs: true,
        rawBody: true,
    });
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