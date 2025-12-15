import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';

@Injectable()
export class CookieMiddleware implements NestMiddleware {
  private cookieParser = cookieParser();

  use(req: Request, res: Response, next: NextFunction) {
    this.cookieParser(req, res, (err) => {
      if (err) {
        console.error('Cookie parsing error:', err);
      }
      next();
    });
  }
}
