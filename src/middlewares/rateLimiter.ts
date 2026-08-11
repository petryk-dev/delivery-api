import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { ApiResponse } from '../types';

const baseHandler = (_req: unknown, res: { status: (c: number) => { json: (b: unknown) => void } }): void => {
  const body: ApiResponse = { success: false, message: 'Too many requests, please try again later.' };
  res.status(429).json(body);
};

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: baseHandler,
});

export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: baseHandler,
});
