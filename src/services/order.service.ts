import createError from 'http-errors';
import { Order, OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { orderStatusQueue } from '../jobs/queues';
import { CreateOrderDto, UpdateOrderStatusDto } from '../validators/order.validator';

export async function createOrder(customerId: string, dto: CreateOrderDto): Promise<Order> {
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: dto.items.map((i) => i.menuItemId) },
      restaurantId: dto.restaurantId,
      isAvailable: true,
    },
  });

  if (menuItems.length !== dto.items.length) {
    throw createError(422, 'One or more menu items are unavailable or not from this restaurant');
  }

  const totalAmount = dto.items.reduce((sum, item) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
    return sum + Number(menuItem.price) * item.quantity;
  }, 0);

  const order = await prisma.order.create({
    data: {
      customerId,
      restaurantId: dto.restaurantId,
      deliveryAddress: dto.deliveryAddress,
      lat: dto.lat,
      lng: dto.lng,
      totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)),
      orderItems: {
        create: dto.items.map((item) => {
          const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
          return {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: menuItem.price,
          };
        }),
      },
    },
    include: { orderItems: true },
  });

  await orderStatusQueue.add('order-created', { orderId: order.id, customerId });
  return order;
}

export async function getMyOrders(customerId: string): Promise<Order[]> {
  return prisma.order.findMany({
    where: { customerId },
    include: { orderItems: { include: { menuItem: true } }, restaurant: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOrderById(id: string, requesterId: string, requesterRole: string): Promise<Order> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderItems: { include: { menuItem: true } },
      restaurant: true,
      payment: true,
      delivery: true,
    },
  });
  if (!order) throw createError(404, 'Order not found');

  const isOwner = order.customerId === requesterId || order.driverId === requesterId;
  if (requesterRole !== 'ADMIN' && !isOwner) throw createError(403, 'Insufficient permissions');

  return order;
}

export async function updateOrderStatus(
  id: string,
  _requesterId: string,
  requesterRole: string,
  dto: UpdateOrderStatusDto,
): Promise<Order> {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw createError(404, 'Order not found');

  const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['PICKED_UP'],
    PICKED_UP: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
  };

  if (!allowedTransitions[order.status].includes(dto.status)) {
    throw createError(422, `Cannot transition from ${order.status} to ${dto.status}`);
  }

  if (requesterRole === 'CUSTOMER' && dto.status !== 'CANCELLED') {
    throw createError(403, 'Customers can only cancel orders');
  }

  const updated = await prisma.order.update({ where: { id }, data: { status: dto.status } });
  await orderStatusQueue.add('status-changed', { orderId: id, status: dto.status });

  return updated;
}

export async function cancelOrder(id: string, customerId: string): Promise<Order> {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw createError(404, 'Order not found');
  if (order.customerId !== customerId) throw createError(403, 'Not your order');
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw createError(422, 'Order cannot be cancelled at this stage');
  }
  return prisma.order.update({ where: { id }, data: { status: 'CANCELLED' } });
}
