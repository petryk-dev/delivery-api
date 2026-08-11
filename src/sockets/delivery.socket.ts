import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { updateLocationSchema } from '../validators/delivery.validator';
import { updateDriverLocation } from '../services/delivery.service';

export function registerDeliveryHandlers(_io: Server, socket: Socket): void {
  // Driver broadcasts their live location; server fans it out to order subscribers.
  // Delegates to the same service the REST PATCH endpoint uses, so the ownership
  // check (this driver must own the delivery for this order) and persistence stay
  // in one place instead of being duplicated — and possibly drifting — here.
  socket.on('driver:locationUpdate', (data: { orderId: string; lat: number; lng: number }) => {
    if (socket.data.role !== 'DRIVER') return;
    void handleLocationUpdate(socket, data);
  });
}

async function handleLocationUpdate(
  socket: Socket,
  data: { orderId: string; lat: number; lng: number },
): Promise<void> {
  const parsed = updateLocationSchema.safeParse({ lat: data.lat, lng: data.lng });
  if (!parsed.success || typeof data.orderId !== 'string' || !data.orderId) {
    logger.warn(`Rejected malformed driver:locationUpdate from ${socket.data.userId}`);
    return;
  }

  try {
    await updateDriverLocation(data.orderId, socket.data.userId, parsed.data);
  } catch (err) {
    logger.warn(
      `Rejected driver:locationUpdate from ${socket.data.userId} for order ${data.orderId}: ${(err as Error).message}`,
    );
  }
}
