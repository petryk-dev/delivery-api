import 'dotenv/config';
import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { redis } from './config/redis';
import { initSocketServer } from './sockets';
import { startEmailWorker } from './jobs/processors/email.processor';
import { startOrderWorker } from './jobs/processors/order.processor';
import { logger } from './utils/logger';

const httpServer = http.createServer(app);

initSocketServer(httpServer);

const emailWorker = startEmailWorker();
const orderWorker = startOrderWorker();

async function start(): Promise<void> {
  await connectDatabase();
  logger.info('Database connected');

  httpServer.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
    logger.info(`API docs at http://localhost:${env.PORT}${env.API_PREFIX}/docs`);
  });
}

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received — shutting down gracefully`);
  await emailWorker.close();
  await orderWorker.close();
  await redis.quit();
  await disconnectDatabase();
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
