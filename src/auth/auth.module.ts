import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy, RefreshTokenStrategy } from './strategies';
import { AuthValidationUtil, PasswordUtil, TokensUtil } from './utils';
import { RateLimitMiddleware, CookieMiddleware } from './middleware';
import { PrismaService } from 'src/database/prisma.service';
import { BrevoService } from 'src/config/services/brevo.service';
import { CloudinaryService } from 'src/config/services/cloudinary.service';

@Module({
  imports: [
    // Passport pour l'authentification
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT Module configuré de manière asynchrone
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRATION', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Services principaux
    AuthService,
    PasswordUtil,
    TokensUtil,
    AuthValidationUtil,

    // Stratégies d'authentification
    JwtStrategy,
    RefreshTokenStrategy,

    // Services externes
    PrismaService,
    BrevoService,
    CloudinaryService,
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule implements NestModule {
  /**
   * Configure les middlewares pour le module Auth
   */
  configure(consumer: MiddlewareConsumer) {
    // Appliquer le middleware de cookies à toutes les routes
    consumer
      .apply(CookieMiddleware)
      .forRoutes({ path: 'auth/*path', method: RequestMethod.ALL });

    // Appliquer le rate limiting aux routes d'authentification
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes(
        'auth/login',
        'auth/register',
        'auth/forgot-password',
        'auth/reset-password',
        'auth/resend-verification',
      );
  }
}
