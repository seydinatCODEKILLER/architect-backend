import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const origins =
    configService.get<string>('ALLOWED_ORIGINS') ?? 'http://localhost:3001';

  // Middlewares de sécurité
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: origins.split(','),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(configService.get('API_PREFIX', 'api'));

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port: number = configService.get('PORT', 3000);
  await app.listen(port);

  console.log(
    `🚀 Application is running on: http://localhost:${port}/${configService.get('API_PREFIX', 'api')}`,
  );
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
