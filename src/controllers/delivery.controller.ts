import { Request, Response, NextFunction } from 'express';
import * as deliveryService from '../services/delivery.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { UpdateLocationDto } from '../validators/delivery.validator';

export async function availableOrders(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await deliveryService.getAvailableOrders();
    sendSuccess(res, orders);
  } catch (err) {
    next(err);
  }
}

export async function acceptOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const delivery = await deliveryService.acceptOrder(req.params.orderId, req.user!.id);
    sendCreated(res, delivery, 'Order accepted');
  } catch (err) {
    next(err);
  }
}

export async function updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const delivery = await deliveryService.updateDriverLocation(
      req.params.orderId,
      req.user!.id,
      req.body as UpdateLocationDto,
    );
    sendSuccess(res, delivery, 'Location updated');
  } catch (err) {
    next(err);
  }
}
