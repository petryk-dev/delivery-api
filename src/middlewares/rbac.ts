import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { Role } from '@prisma/client';

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError(401, 'Unauthenticated'));
    }
    if (!roles.includes(req.user.role)) {
      return next(createError(403, 'Insufficient permissions'));
    }
    next();
  };
}
