import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { updateUserSchema } from '../validators/user.validator';
import * as ctrl from '../controllers/user.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/me', authenticate, ctrl.getMe);

/**
 * @swagger
 * /users/me:
 *   put:
 *     tags: [Users]
 *     summary: Update current user profile
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/me', authenticate, validate(updateUserSchema), ctrl.updateMe);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     tags: [Users]
 *     summary: Delete own account
 *     responses:
 *       204:
 *         description: Account deleted
 */
router.delete('/me', authenticate, ctrl.deleteMe);

export default router;
