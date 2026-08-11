import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { sendSuccess, sendNoContent } from '../utils/response';
import { UpdateUserDto } from '../validators/user.validator';

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getMe(req.user!.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.updateMe(req.user!.id, req.body as UpdateUserDto);
    sendSuccess(res, user, 'Profile updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.deleteMe(req.user!.id);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
