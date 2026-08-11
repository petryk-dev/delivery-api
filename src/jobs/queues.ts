import { Queue } from 'bullmq';
import { redisOptions } from '../config/redis';

export const emailQueue = new Queue('email', { connection: redisOptions });
export const orderStatusQueue = new Queue('order-status', { connection: redisOptions });

export const queues = [emailQueue, orderStatusQueue];
