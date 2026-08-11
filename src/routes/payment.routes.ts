import { Router } from 'express';
import express from 'express';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createPaymentIntentSchema } from '../validators/payment.validator';
import * as ctrl from '../controllers/payment.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Stripe payment processing
 */

/**
 * @swagger
 * /payments/create-intent:
 *   post:
 *     tags: [Payments]
 *     summary: Create a Stripe PaymentIntent for an order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment intent created
 */
router.post('/create-intent', authenticate, validate(createPaymentIntentSchema), ctrl.createIntent);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Stripe webhook endpoint (raw body required)
 *     security: []
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook', express.raw({ type: 'application/json' }), ctrl.stripeWebhook);

export default router;
