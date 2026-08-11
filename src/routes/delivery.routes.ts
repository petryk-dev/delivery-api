import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';
import { validate } from '../middlewares/validate';
import { updateLocationSchema } from '../validators/delivery.validator';
import * as ctrl from '../controllers/delivery.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Delivery
 *   description: Driver delivery management
 */

/**
 * @swagger
 * /delivery/available-orders:
 *   get:
 *     tags: [Delivery]
 *     summary: List orders available for pickup (drivers only)
 *     responses:
 *       200:
 *         description: Available orders
 */
router.get('/available-orders', authenticate, authorize('DRIVER'), ctrl.availableOrders);

/**
 * @swagger
 * /delivery/{orderId}/accept:
 *   post:
 *     tags: [Delivery]
 *     summary: Accept an order for delivery (drivers only)
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Order accepted
 */
router.post('/:orderId/accept', authenticate, authorize('DRIVER'), ctrl.acceptOrder);

/**
 * @swagger
 * /delivery/{orderId}/location:
 *   patch:
 *     tags: [Delivery]
 *     summary: Update driver location for an active delivery
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lat, lng]
 *             properties:
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location updated
 */
router.patch(
  '/:orderId/location',
  authenticate,
  authorize('DRIVER'),
  validate(updateLocationSchema),
  ctrl.updateLocation,
);

export default router;
