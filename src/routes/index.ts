import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import restaurantRoutes from './restaurant.routes';
import orderRoutes from './order.routes';
import paymentRoutes from './payment.routes';
import deliveryRoutes from './delivery.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/delivery', deliveryRoutes);

export default router;
