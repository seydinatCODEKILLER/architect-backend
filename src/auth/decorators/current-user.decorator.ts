import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthUser } from '../interfaces';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: AuthUser;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    // Si un champ spécifique est demandé, le retourner
    if (data) {
      return user[data];
    }

    // Sinon retourner l'utilisateur entier
    return user;
  },
);
