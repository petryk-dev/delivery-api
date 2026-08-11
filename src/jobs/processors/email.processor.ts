import { Worker, Job } from 'bullmq';
import { redisOptions } from '../../config/redis';
import { logger } from '../../utils/logger';
import { sendWelcomeEmail, sendOrderStatusEmail, sendVerificationEmail } from '../../services/email.service';

interface WelcomeJobData {
  userId: string;
  email: string;
  name: string;
}

interface OrderStatusJobData {
  email: string;
  orderId: string;
  status: string;
}

interface VerificationJobData {
  email: string;
  name: string;
  token: string;
}

async function processEmailJob(job: Job): Promise<void> {
  switch (job.name) {
    case 'welcome': {
      const { email, name } = job.data as WelcomeJobData;
      await sendWelcomeEmail(email, name);
      break;
    }
    case 'order-status': {
      const { email, orderId, status } = job.data as OrderStatusJobData;
      await sendOrderStatusEmail(email, orderId, status);
      break;
    }
    case 'verification': {
      const { email, name, token } = job.data as VerificationJobData;
      await sendVerificationEmail(email, name, token);
      break;
    }
    default:
      logger.warn(`Unknown email job: ${job.name}`);
  }
}

export function startEmailWorker(): Worker {
  const worker = new Worker('email', processEmailJob, { connection: redisOptions });

  worker.on('completed', (job) => logger.info(`Email job ${job.id} completed`));
  worker.on('failed', (job, err) =>
    logger.error(`Email job ${job?.id} failed: ${err.message}`),
  );

  return worker;
}
