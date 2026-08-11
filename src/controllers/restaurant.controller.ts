import { Request, Response, NextFunction } from 'express';
import * as restaurantService from '../services/restaurant.service';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/response';
import {
  CreateRestaurantDto,
  UpdateRestaurantDto,
  RestaurantQueryDto,
} from '../validators/restaurant.validator';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await restaurantService.listRestaurants(req.query as unknown as RestaurantQueryDto);
    sendPaginated(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const restaurant = await restaurantService.getRestaurant(req.params.id);
    sendSuccess(res, restaurant);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const restaurant = await restaurantService.createRestaurant(
      req.user!.id,
      req.body as CreateRestaurantDto,
    );
    sendCreated(res, restaurant, 'Restaurant created');
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const restaurant = await restaurantService.updateRestaurant(
      req.params.id,
      req.user!.id,
      req.user!.role,
      req.body as UpdateRestaurantDto,
    );
    sendSuccess(res, restaurant, 'Restaurant updated');
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await restaurantService.deleteRestaurant(req.params.id, req.user!.id, req.user!.role);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
