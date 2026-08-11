import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
