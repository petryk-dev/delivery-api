import { Worker, Job } from 'bullmq';
import { redisOptions } from '../../config/redis';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';
import { emailQueue } from '../queues';

interface OrderCreatedData {
  orderId: string;
  customerId: string;
}

interface StatusChangedData {
  orderId: string;
  status: string;
}

async function processOrderJob(job: Job): Promise<void> {
  switch (job.name) {
    case 'order-created': {
      const { orderId, customerId } = job.data as OrderCreatedData;
      const user = await prisma.user.findUnique({ where: { id: customerId } });
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (user && order) {
        await emailQueue.add('order-status', {
          email: user.email,
          orderId,
          status: 'PENDING',
        });
      }
      break;
    }
    case 'status-changed': {
      const { orderId, status } = job.data as StatusChangedData;
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true },
      });
      if (order) {
        await emailQueue.add('order-status', {
          email: order.customer.email,
          orderId,
          status,
        });
      }
      break;
    }
    default:
      logger.warn(`Unknown order job: ${job.name}`);
  }
}

export function startOrderWorker(): Worker {
  const worker = new Worker('order-status', processOrderJob, { connection: redisOptions });

  worker.on('completed', (job) => logger.info(`Order job ${job.id} completed`));
  worker.on('failed', (job, err) =>
    logger.error(`Order job ${job?.id} failed: ${err.message}`),
  );

  return worker;
}
