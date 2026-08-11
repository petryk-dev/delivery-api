import { z } from 'zod';

export const createRestaurantSchema = z.object({
  name: z.string().min(2).max(150),
  address: z.string().min(5),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  cuisineType: z.string().min(2),
  isOpen: z.boolean().optional().default(true),
});

export const updateRestaurantSchema = createRestaurantSchema.partial();

export const restaurantQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  cuisineType: z.string().optional(),
  isOpen: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  search: z.string().optional(),
});

export type CreateRestaurantDto = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantDto = z.infer<typeof updateRestaurantSchema>;
export type RestaurantQueryDto = z.infer<typeof restaurantQuerySchema>;
