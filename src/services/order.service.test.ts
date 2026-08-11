import { CreateOrderDto, UpdateOrderStatusDto } from '../validators/order.validator';

jest.mock('../config/database', () => ({
  prisma: {
    menuItem: { findMany: jest.fn() },
    order: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  },
}));
jest.mock('../jobs/queues', () => ({
  orderStatusQueue: { add: jest.fn() },
  emailQueue: { add: jest.fn() },
}));

import { prisma } from '../config/database';
import * as orderService from './order.service';

const mockMenuItem = prisma.menuItem as unknown as { findMany: jest.Mock };
const mockOrder = prisma.order as unknown as { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };

const createOrderDto: CreateOrderDto = {
  restaurantId: 'r1',
  deliveryAddress: '1 Main St',
  lat: 40.7,
  lng: -74,
  items: [
    { menuItemId: 'm1', quantity: 2 },
    { menuItemId: 'm2', quantity: 1 },
  ],
};

describe('order.service', () => {
  describe('createOrder', () => {
    it('computes totalAmount from live menu prices, not client-supplied ones', async () => {
      mockMenuItem.findMany.mockResolvedValueOnce([
        { id: 'm1', price: 10, restaurantId: 'r1', isAvailable: true },
        { id: 'm2', price: 5, restaurantId: 'r1', isAvailable: true },
      ]);
      mockOrder.create.mockImplementationOnce(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'o1',
        ...data,
      }));

      const order = await orderService.createOrder('cust1', createOrderDto);

      // 2 * 10 + 1 * 5 = 25
      expect(Number(order.totalAmount)).toBe(25);
    });

    it('rejects with 422 when an item is unavailable or belongs to a different restaurant', async () => {
      // Only one of the two requested items comes back from the DB query.
      mockMenuItem.findMany.mockResolvedValueOnce([{ id: 'm1', price: 10, restaurantId: 'r1', isAvailable: true }]);

      await expect(orderService.createOrder('cust1', createOrderDto)).rejects.toMatchObject({ status: 422 });
      expect(mockOrder.create).not.toHaveBeenCalled();
    });
  });

  describe('updateOrderStatus', () => {
    const statusDto = (status: UpdateOrderStatusDto['status']): UpdateOrderStatusDto => ({ status });

    it('allows a valid transition performed by staff', async () => {
      mockOrder.findUnique.mockResolvedValueOnce({ id: 'o1', status: 'PENDING' });
      mockOrder.update.mockResolvedValueOnce({ id: 'o1', status: 'CONFIRMED' });

      const updated = await orderService.updateOrderStatus('o1', 'admin1', 'ADMIN', statusDto('CONFIRMED'));

      expect(updated.status).toBe('CONFIRMED');
    });

    it('rejects a transition that skips the status machine (PENDING -> DELIVERED)', async () => {
      mockOrder.findUnique.mockResolvedValueOnce({ id: 'o1', status: 'PENDING' });

      await expect(orderService.updateOrderStatus('o1', 'admin1', 'ADMIN', statusDto('DELIVERED'))).rejects.toMatchObject({
        status: 422,
      });
    });

    it('restricts customers to cancelling only, even for otherwise-valid transitions', async () => {
      mockOrder.findUnique.mockResolvedValueOnce({ id: 'o1', status: 'PENDING' });

      await expect(orderService.updateOrderStatus('o1', 'cust1', 'CUSTOMER', statusDto('CONFIRMED'))).rejects.toMatchObject({
        status: 403,
      });
    });

    it('rejects with 404 for a nonexistent order', async () => {
      mockOrder.findUnique.mockResolvedValueOnce(null);

      await expect(orderService.updateOrderStatus('missing', 'admin1', 'ADMIN', statusDto('CONFIRMED'))).rejects.toMatchObject({
        status: 404,
      });
    });
  });
});
