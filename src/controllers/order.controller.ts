import { Request, Response, NextFunction } from 'express';
import * as orderService from '../services/order.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { CreateOrderDto, UpdateOrderStatusDto } from '../validators/order.validator';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await orderService.createOrder(req.user!.id, req.body as CreateOrderDto);
    sendCreated(res, order, 'Order placed');
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await orderService.getMyOrders(req.user!.id);
    sendSuccess(res, orders);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user!.id, req.user!.role);
    sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await orderService.updateOrderStatus(
      req.params.id,
      req.user!.id,
      req.user!.role,
      req.body as UpdateOrderStatusDto,
    );
    sendSuccess(res, order, 'Order status updated');
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await orderService.cancelOrder(req.params.id, req.user!.id);
    sendNoContent(res);
    void order;
  } catch (err) {
    next(err);
  }
}
