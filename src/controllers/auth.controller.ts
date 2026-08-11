import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { RegisterDto, LoginDto, RefreshTokenDto, VerifyEmailDto } from '../validators/auth.validator';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tokens = await authService.register(req.body as RegisterDto);
    sendCreated(res, tokens, 'Account created successfully');
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tokens = await authService.login(req.body as LoginDto);
    sendSuccess(res, tokens, 'Logged in successfully');
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.logout(req.user!.id);
    sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: token } = req.body as RefreshTokenDto;
    const tokens = await authService.refreshTokens(token);
    sendSuccess(res, tokens, 'Tokens refreshed');
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body as VerifyEmailDto;
    await authService.verifyEmail(token);
    sendSuccess(res, null, 'Email verified');
  } catch (err) {
    next(err);
  }
}
