import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/order.validator';
import * as ctrl from '../controllers/order.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order lifecycle management
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Place a new order
 *     responses:
 *       201:
 *         description: Order placed
 */
router.post('/', authenticate, validate(createOrderSchema), ctrl.create);

/**
 * @swagger
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get authenticated user's orders
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/', authenticate, ctrl.list);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order detail
 *       404:
 *         description: Not found
 */
router.get('/:id', authenticate, ctrl.getOne);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CONFIRMED, PREPARING, PICKED_UP, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', authenticate, validate(updateOrderStatusSchema), ctrl.updateStatus);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   delete:
 *     tags: [Orders]
 *     summary: Cancel an order
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Cancelled
 */
router.delete('/:id/cancel', authenticate, ctrl.cancel);

export default router;
