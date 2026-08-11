import createError from 'http-errors';
import { Order, Delivery } from '@prisma/client';
import { prisma } from '../config/database';
import { UpdateLocationDto } from '../validators/delivery.validator';
import { getSocketServer } from '../sockets';

export async function getAvailableOrders(): Promise<Order[]> {
  return prisma.order.findMany({
    where: { status: 'CONFIRMED', driverId: null },
    include: { restaurant: true, orderItems: { include: { menuItem: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function acceptOrder(orderId: string, driverId: string): Promise<Delivery> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw createError(404, 'Order not found');
  if (order.status !== 'CONFIRMED') throw createError(422, 'Order is not available for pickup');
  if (order.driverId) throw createError(409, 'Order already accepted by another driver');

  const [, delivery] = await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { driverId, status: 'PREPARING' } }),
    prisma.delivery.create({ data: { orderId, driverId } }),
  ]);

  const io = getSocketServer();
  if (io) {
    io.to(`order:${orderId}`).emit('order:statusUpdate', { orderId, status: 'PREPARING', driverId });
  }

  return delivery;
}

export async function updateDriverLocation(
  orderId: string,
  driverId: string,
  dto: UpdateLocationDto,
): Promise<Delivery> {
  const delivery = await prisma.delivery.findUnique({ where: { orderId } });
  if (!delivery) throw createError(404, 'Delivery not found');
  if (delivery.driverId !== driverId) throw createError(403, 'Not your delivery');

  const updated = await prisma.delivery.update({
    where: { orderId },
    data: { currentLat: dto.lat, currentLng: dto.lng },
  });

  const io = getSocketServer();
  if (io) {
    io.to(`order:${orderId}`).emit('driver:locationUpdate', {
      orderId,
      lat: dto.lat,
      lng: dto.lng,
    });
  }

  return updated;
}
