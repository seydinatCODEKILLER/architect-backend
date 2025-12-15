import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/database/prisma.service';
import { AuthJwtPayload } from '../interfaces';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { Request } from 'express';

interface RequestWithCookies extends Request {
  cookies: {
    [key: string]: string;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: RequestWithCookies) => request?.cookies?.access_token,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Valide le payload JWT et retourne l'utilisateur
   */
  async validate(payload: AuthJwtPayload) {
    try {
      // Vérifier que le payload contient les informations nécessaires
      if (!payload?.sub || !payload?.email) {
        throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.INVALID_TOKEN);
      }

      // Récupérer l'utilisateur depuis la base de données
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          avatarUrl: true,
          emailVerified: true,
          authProvider: true,
          authProviderId: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.USER_NOT_FOUND);
      }

      // Vérifier si l'email est vérifié (si requis)
      const requireEmailVerification = this.configService.get<boolean>(
        'EMAIL_VERIFICATION_ENABLED',
        true,
      );

      if (requireEmailVerification && !user.emailVerified) {
        throw new UnauthorizedException(
          AUTH_CONSTANTS.ERRORS.EMAIL_NOT_VERIFIED,
        );
      }

      // Mettre à jour la date de dernière connexion
      await this.updateLastLogin(user.id);

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.UNAUTHORIZED);
    }
  }

  /**
   * Met à jour la date de dernière connexion
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
      });
    } catch (error) {
      console.error('Failed to update last login:', error);
    }
  }
}
