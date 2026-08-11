import { Request, Response, NextFunction } from 'express';
import * as menuService from '../services/menu.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { CreateMenuItemDto, UpdateMenuItemDto } from '../validators/menu.validator';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await menuService.listMenu(req.params.restaurantId);
    sendSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await menuService.createMenuItem(
      req.params.restaurantId,
      req.user!.id,
      req.user!.role,
      req.body as CreateMenuItemDto,
    );
    sendCreated(res, item, 'Menu item created');
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await menuService.updateMenuItem(
      req.params.restaurantId,
      req.params.itemId,
      req.user!.id,
      req.user!.role,
      req.body as UpdateMenuItemDto,
    );
    sendSuccess(res, item, 'Menu item updated');
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await menuService.deleteMenuItem(
      req.params.restaurantId,
      req.params.itemId,
      req.user!.id,
      req.user!.role,
    );
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
