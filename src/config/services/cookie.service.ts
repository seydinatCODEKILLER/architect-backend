import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Tokens } from '../interfaces/cookie.interface';

@Injectable()
export class CookieService {
  private readonly isProduction: boolean;

  constructor(private configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
  }

  /**
   * Définit les cookies d'authentification
   */
  setAuthCookies(response: Response, tokens: Tokens): void {
    // Access token
    this.setCookie(response, 'access_token', tokens.accessToken, {
      httpOnly: true,
      maxAge: tokens.expiresIn * 1000,
      path: '/',
    });

    // Refresh token
    this.setCookie(response, 'refresh_token', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/api/auth',
    });

    // Session active (frontend)
    this.setCookie(response, 'session_active', 'true', {
      httpOnly: false,
      maxAge: tokens.expiresIn * 1000,
      path: '/',
    });
  }

  /**
   * Nettoie tous les cookies d'authentification
   */
  clearAuthCookies(response: Response): void {
    this.clearCookie(response, 'access_token', { path: '/' });
    this.clearCookie(response, 'refresh_token', { path: '/api/auth' });
    this.clearCookie(response, 'session_active', { path: '/' });
  }

  /**
   * Définit un cookie avec les options par défaut
   */
  setCookie(
    response: Response,
    name: string,
    value: string,
    options: CookieOptions = {},
  ): void {
    const defaultOptions: CookieOptions = {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'strict' : 'lax',
      path: '/',
    };

    response.cookie(name, value, { ...defaultOptions, ...options });
  }

  /**
   * Efface un cookie spécifique
   */
  clearCookie(
    response: Response,
    name: string,
    options: CookieOptions = {},
  ): void {
    const defaultOptions: CookieOptions = {
      secure: this.isProduction,
      sameSite: this.isProduction ? 'strict' : 'lax',
    };

    response.clearCookie(name, { ...defaultOptions, ...options });
  }

  /**
   * Définit un cookie de session (pour OAuth, etc.)
   */
  setSessionCookie(response: Response, name: string, value: string): void {
    this.setCookie(response, name, value, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000, // 10 minutes
    });
  }

  /**
   * Récupère les options de sécurité par défaut
   */
  getSecurityOptions(): Partial<CookieOptions> {
    return {
      secure: this.isProduction,
      sameSite: this.isProduction ? 'strict' : 'none',
    };
  }
}
