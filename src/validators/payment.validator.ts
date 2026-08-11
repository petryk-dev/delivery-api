import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  orderId: z.string().cuid(),
});

export type CreatePaymentIntentDto = z.infer<typeof createPaymentIntentSchema>;
