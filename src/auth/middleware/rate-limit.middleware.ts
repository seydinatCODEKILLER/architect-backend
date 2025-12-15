import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

interface RateLimitData {
  count: number;
  firstRequest: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly rateLimitStore = new Map<string, RateLimitData>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(private readonly configService: ConfigService) {
    this.windowMs = this.configService.get<number>(
      'RATE_LIMIT_WINDOW_MS',
      AUTH_CONSTANTS.DEFAULTS.RATE_LIMIT_WINDOW_MS,
    );
    this.maxRequests = this.configService.get<number>(
      'RATE_LIMIT_MAX_REQUESTS',
      AUTH_CONSTANTS.DEFAULTS.RATE_LIMIT_MAX_REQUESTS,
    );

    // Nettoyer périodiquement le store
    setInterval(() => this.cleanupStore(), this.windowMs);
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Ne pas appliquer le rate limiting aux routes publiques de santé
    if (req.path === '/health' || req.path === '/docs') {
      return next();
    }

    const key = this.getClientKey(req);
    const now = Date.now();

    // Récupérer ou initialiser les données de rate limiting
    let data = this.rateLimitStore.get(key);

    if (!data) {
      data = { count: 1, firstRequest: now };
      this.rateLimitStore.set(key, data);
    } else {
      // Vérifier si la fenêtre de temps est dépassée
      if (now - data.firstRequest > this.windowMs) {
        // Réinitialiser le compteur
        data.count = 1;
        data.firstRequest = now;
      } else {
        // Incrémenter le compteur
        data.count++;
      }
    }

    // Vérifier si la limite est dépassée
    if (data.count > this.maxRequests) {
      // Calculer le temps d'attente restant
      const resetTime = data.firstRequest + this.windowMs;
      const waitTime = Math.ceil((resetTime - now) / 1000);

      // Ajouter les headers de rate limiting
      res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', resetTime.toString());

      throw new HttpException(
        {
          message: AUTH_CONSTANTS.ERRORS.RATE_LIMIT_EXCEEDED,
          retryAfter: waitTime,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Ajouter les headers de rate limiting
    const remaining = Math.max(0, this.maxRequests - data.count);
    const resetTime = data.firstRequest + this.windowMs;

    res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', resetTime.toString());

    next();
  }

  /**
   * Génère une clé unique pour le client
   */
  private getClientKey(req: Request): string {
    // Utiliser l'IP + user agent pour identifier le client
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const route = req.path;

    return `${ip}-${userAgent}-${route}`;
  }

  /**
   * Nettoie le store des anciennes entrées
   */
  private cleanupStore(): void {
    const now = Date.now();

    for (const [key, data] of this.rateLimitStore.entries()) {
      if (now - data.firstRequest > this.windowMs) {
        this.rateLimitStore.delete(key);
      }
    }
  }
}
