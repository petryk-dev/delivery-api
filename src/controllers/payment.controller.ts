import { Request, Response, NextFunction } from 'express';
import * as paymentService from '../services/payment.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { CreatePaymentIntentDto } from '../validators/payment.validator';

export async function createIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await paymentService.createPaymentIntent(
      (req.body as CreatePaymentIntentDto).orderId,
      req.user!.id,
    );
    sendCreated(res, result, 'Payment intent created');
  } catch (err) {
    next(err);
  }
}

export async function stripeWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const signature = req.headers['stripe-signature'] as string;
    await paymentService.handleStripeWebhook(req.body as Buffer, signature);
    sendSuccess(res, null, 'Webhook processed');
  } catch (err) {
    next(err);
  }
}
