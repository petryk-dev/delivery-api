import { Request, Response, NextFunction } from 'express';
import { HttpError } from 'http-errors';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error(`${req.method} ${req.path} — ${err.message}`, { stack: err.stack });

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.');
      errors[key] = [...(errors[key] ?? []), issue.message];
    }
    const body: ApiResponse = { success: false, message: 'Validation error', errors };
    res.status(422).json(body);
    return;
  }

  if (err instanceof HttpError) {
    const body: ApiResponse = { success: false, message: err.message };
    res.status(err.status).json(body);
    return;
  }

  const body: ApiResponse = { success: false, message: 'Internal server error' };
  res.status(500).json(body);
}
