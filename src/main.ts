import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Http');

  app.enableCors({
    origin: configService.get<string>(
      'FRONTEND_BASE_URL',
      'http://localhost:5173',
    ),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.use((request: Request, response: Response, next: NextFunction) => {
    const startedAt = Date.now();
    const { method, originalUrl } = request;
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const userAgent = request.get('user-agent') || 'unknown';

    logger.log(
      JSON.stringify({
        event: 'request_incoming',
        method,
        path: originalUrl,
        ip,
        userAgent,
      }),
    );

    response.on('finish', () => {
      logger.log(
        JSON.stringify({
          event: 'request_completed',
          method,
          path: originalUrl,
          ip,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        }),
      );
    });

    next();
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
