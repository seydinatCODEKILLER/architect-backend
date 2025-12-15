import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { AuthUser } from '../interfaces';

interface JwtErrorInfo {
  name?: 'TokenExpiredError' | 'JsonWebTokenError';
  message?: string;
}

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

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
