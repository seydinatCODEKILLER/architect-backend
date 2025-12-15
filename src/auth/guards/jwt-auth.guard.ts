import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { AuthUser } from '../interfaces';

export interface JwtErrorInfo {
  name?: 'TokenExpiredError' | 'JsonWebTokenError';
  message?: string;
}

export type PassportError = Error | null;

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Vérifie si la route est publique avant d'appliquer l'authentification
   */
  canActivate(context: ExecutionContext) {
    // Vérifier si la route est marquée comme publique
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * Gère le résultat de l'authentification
   */
  handleRequest<TUser = AuthUser>(
    err: unknown,
    user: TUser | null,
    info: JwtErrorInfo | null,
  ): TUser {
    if (err || !user) {
      let errorMessage: string = AUTH_CONSTANTS.ERRORS.UNAUTHORIZED;

      if (info?.name === 'TokenExpiredError') {
        errorMessage = AUTH_CONSTANTS.ERRORS.TOKEN_EXPIRED;
      } else if (info?.name === 'JsonWebTokenError') {
        errorMessage = AUTH_CONSTANTS.ERRORS.INVALID_TOKEN;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      throw new UnauthorizedException(errorMessage);
    }

    return user;
  }
}
