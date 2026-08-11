import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';

export function registerOrderHandlers(_io: Server, socket: Socket): void {
  // Client joins a room to receive real-time updates for a specific order
  socket.on('order:subscribe', (orderId: string) => {
    socket.join(`order:${orderId}`);
    logger.info(`User ${socket.data.userId} subscribed to order:${orderId}`);
  });

  socket.on('order:unsubscribe', (orderId: string) => {
    socket.leave(`order:${orderId}`);
  });
}

// Called from services to emit order status changes
export function emitOrderStatusUpdate(
  io: Server,
  orderId: string,
  status: string,
  extra?: Record<string, unknown>,
): void {
  io.to(`order:${orderId}`).emit('order:statusUpdate', { orderId, status, ...extra });
}
