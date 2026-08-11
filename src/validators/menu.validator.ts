import { z } from 'zod';

export const createMenuItemSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(500).optional(),
  price: z.number().positive().multipleOf(0.01),
  category: z.string().min(2),
  isAvailable: z.boolean().optional().default(true),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export type CreateMenuItemDto = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemDto = z.infer<typeof updateMenuItemSchema>;
