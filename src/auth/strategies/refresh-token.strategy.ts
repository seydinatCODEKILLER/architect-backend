import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { PrismaService } from 'src/database/prisma.service';
import { AuthJwtPayload } from '../interfaces';
import { Request } from 'express';

interface RequestWithRefreshToken extends Request {
  body: { refreshToken?: string };
  cookies: { refresh_token?: string };
  query: { refreshToken?: string };
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const refreshSecret =
      configService.get<string>('JWT_REFRESH_SECRET') ||
      configService.get<string>('JWT_SECRET');

    if (!refreshSecret) {
      throw new Error('JWT secret is not defined');
    }

    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromBodyField('refreshToken'),
        (request: RequestWithRefreshToken): string | null =>
          request.cookies?.refresh_token ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: refreshSecret,
      passReqToCallback: true,
    };

    super(options);
  }

  /**
   * Valide le refresh token
   */
  async validate(request: any, payload: AuthJwtPayload) {
    try {
      if (!payload?.sub || !payload?.email) {
        throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.INVALID_TOKEN);
      }

      // Extraire le refresh token de la requête
      const refreshToken = this.extractRefreshToken(request);

      if (!refreshToken) {
        throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.INVALID_TOKEN);
      }

      // Vérifier que le refresh token existe en base de données
      const session = await this.prisma.session.findFirst({
        where: {
          userId: payload.sub,
          refreshToken,
          expiresAt: { gt: new Date() },
        },
      });

      if (!session) {
        throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.SESSION_EXPIRED);
      }

      // Mettre à jour la date d'utilisation
      await this.updateSessionLastUsed(session.id);

      return {
        userId: payload.sub,
        email: payload.email,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.UNAUTHORIZED);
    }
  }

  /**
   * Extrait le refresh token de la requête
   */
  private extractRefreshToken(request: RequestWithRefreshToken): string | null {
    // Depuis l'Authorization header
    const authHeader = request.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Depuis le body
    if (request.body?.refreshToken) {
      return request.body.refreshToken;
    }

    // Depuis les cookies
    if (request.cookies?.refresh_token) {
      return request.cookies.refresh_token;
    }

    // Depuis les query parameters
    if (request.query?.refreshToken) {
      return request.query.refreshToken;
    }

    return null;
  }

  /**
   * Met à jour la date d'utilisation de la session
   */
  private async updateSessionLastUsed(sessionId: string): Promise<void> {
    try {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { lastUsedAt: new Date() },
      });
    } catch (error) {
      // Silently fail - this is not critical
      console.error('Failed to update session last used:', error);
    }
  }
}
