import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';
import { validate } from '../middlewares/validate';
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  restaurantQuerySchema,
} from '../validators/restaurant.validator';
import * as restaurantCtrl from '../controllers/restaurant.controller';
import * as menuCtrl from '../controllers/menu.controller';
import { createMenuItemSchema, updateMenuItemSchema } from '../validators/menu.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Restaurants
 *   description: Restaurant management
 */

/**
 * @swagger
 * /restaurants:
 *   get:
 *     tags: [Restaurants]
 *     summary: List restaurants (with filters)
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: cuisineType
 *         schema: { type: string }
 *       - in: query
 *         name: isOpen
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated restaurant list
 */
router.get('/', validate(restaurantQuerySchema, 'query'), restaurantCtrl.list);

/**
 * @swagger
 * /restaurants/{id}:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get restaurant by ID (includes menu)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Restaurant details
 *       404:
 *         description: Not found
 */
router.get('/:id', restaurantCtrl.getOne);

/**
 * @swagger
 * /restaurants:
 *   post:
 *     tags: [Restaurants]
 *     summary: Create restaurant (admin or driver/owner)
 *     responses:
 *       201:
 *         description: Restaurant created
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'DRIVER'),
  validate(createRestaurantSchema),
  restaurantCtrl.create,
);

/**
 * @swagger
 * /restaurants/{id}:
 *   put:
 *     tags: [Restaurants]
 *     summary: Update restaurant
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'DRIVER'),
  validate(updateRestaurantSchema),
  restaurantCtrl.update,
);

/**
 * @swagger
 * /restaurants/{id}:
 *   delete:
 *     tags: [Restaurants]
 *     summary: Delete restaurant
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Deleted
 */
router.delete('/:id', authenticate, authorize('ADMIN', 'DRIVER'), restaurantCtrl.remove);

// ─── Menu sub-routes ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /restaurants/{restaurantId}/menu:
 *   get:
 *     tags: [Menu]
 *     summary: List menu items for a restaurant
 *     security: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Menu items
 */
router.get('/:restaurantId/menu', menuCtrl.list);

/**
 * @swagger
 * /restaurants/{restaurantId}/menu:
 *   post:
 *     tags: [Menu]
 *     summary: Add a menu item (owner/admin)
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  '/:restaurantId/menu',
  authenticate,
  authorize('ADMIN', 'DRIVER'),
  validate(createMenuItemSchema),
  menuCtrl.create,
);

/**
 * @swagger
 * /restaurants/{restaurantId}/menu/{itemId}:
 *   put:
 *     tags: [Menu]
 *     summary: Update a menu item
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
router.put(
  '/:restaurantId/menu/:itemId',
  authenticate,
  authorize('ADMIN', 'DRIVER'),
  validate(updateMenuItemSchema),
  menuCtrl.update,
);

/**
 * @swagger
 * /restaurants/{restaurantId}/menu/{itemId}:
 *   delete:
 *     tags: [Menu]
 *     summary: Delete a menu item
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Deleted
 */
router.delete(
  '/:restaurantId/menu/:itemId',
  authenticate,
  authorize('ADMIN', 'DRIVER'),
  menuCtrl.remove,
);

export default router;
