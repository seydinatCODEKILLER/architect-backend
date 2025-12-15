import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { setupSwagger } from './config/utils/swagger.config';

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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
    exposedHeaders: ['Set-Cookie'],
  });

  // Global prefix
  app.setGlobalPrefix(configService.get('API_PREFIX', 'api'));

  //setupSwagger(app);
  if (configService.get('NODE_ENV') !== 'production') {
    setupSwagger(app);
    console.log('📚 Swagger documentation available at /api/docs');
  }

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

  console.log(`
🚀 Application is running on: http://localhost:${port}/${(configService.get('API_PREFIX'), 'api')}
📚 API Documentation: http://localhost:${port}/api/docs
📄 OpenAPI Spec: http://localhost:${port}/api/docs-json
  `);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
