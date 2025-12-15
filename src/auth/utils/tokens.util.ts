import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { AuthJwtPayload, Tokens } from '../interfaces';

@Injectable()
export class TokensUtil {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Génère un token JWT d'accès
   */
  async generateAccessToken(userId: string, email: string): Promise<string> {
    const payload: AuthJwtPayload = {
      sub: userId,
      email,
    };

    const expiresIn = (this.configService.get<string>(
      'JWT_ACCESS_EXPIRATION',
    ) ?? '15m') as JwtSignOptions['expiresIn'];

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn,
    });
  }

  /**
   * Génère un refresh token
   */
  async generateRefreshToken(userId: string, email: string): Promise<string> {
    const payload: AuthJwtPayload = { sub: userId, email };

    const expires =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') ?? '7d';

    return this.jwtService.signAsync(payload, {
      secret:
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        this.configService.get<string>('JWT_SECRET'),
      expiresIn: expires as `${number}${'d' | 'h' | 'm'}` | number,
    });
  }

  /**
   * Génère un token de vérification d'email
   */
  generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Génère un token de réinitialisation de mot de passe
   */
  generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Génère les tokens d'accès et de rafraîchissement
   */
  async generateTokens(userId: string, email: string): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, email),
      this.generateRefreshToken(userId, email),
    ]);

    const expiresIn = this.getTokenExpiry(accessToken);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Vérifie un token JWT
   */
  async verifyToken(
    token: string,
    isRefreshToken: boolean = false,
  ): Promise<AuthJwtPayload | null> {
    try {
      const secret = isRefreshToken
        ? this.configService.get<string>('JWT_REFRESH_SECRET') ||
          this.configService.get<string>('JWT_SECRET')
        : this.configService.get<string>('JWT_SECRET');

      return await this.jwtService.verifyAsync<AuthJwtPayload>(token, {
        secret,
      });
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  /**
   * Rafraîchit un token d'accès avec un refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresIn: number } | null> {
    const payload = await this.verifyToken(refreshToken, true);

    if (!payload) {
      return null;
    }

    const accessToken = await this.generateAccessToken(
      payload.sub,
      payload.email,
    );
    const expiresIn = this.getTokenExpiry(accessToken);

    return {
      accessToken,
      expiresIn,
    };
  }

  /**
   * Calcule l'expiration d'un token
   */
  private getTokenExpiry(token: string): number {
    try {
      const decoded: unknown = this.jwtService.decode(token);

      if (
        decoded &&
        typeof decoded === 'object' &&
        'exp' in decoded &&
        typeof (decoded as { exp: unknown }).exp === 'number'
      ) {
        const exp = (decoded as { exp: number }).exp;
        const now = Math.floor(Date.now() / 1000);
        return exp - now;
      }
    } catch (error) {
      console.error(error);
    }

    // Default to 15 minutes in seconds
    return 15 * 60;
  }

  /**
   * Calcule la date d'expiration pour un token temporaire
   */
  calculateExpiryDate(expiresIn: string): Date {
    const now = new Date();

    if (expiresIn.endsWith('h')) {
      const hours = parseInt(expiresIn);
      now.setHours(now.getHours() + hours);
    } else if (expiresIn.endsWith('d')) {
      const days = parseInt(expiresIn);
      now.setDate(now.getDate() + days);
    } else if (expiresIn.endsWith('m')) {
      const minutes = parseInt(expiresIn);
      now.setMinutes(now.getMinutes() + minutes);
    } else {
      // Default to 24 hours
      now.setHours(now.getHours() + 24);
    }

    return now;
  }

  /**
   * Vérifie si un token a expiré
   */
  isTokenExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }
}
