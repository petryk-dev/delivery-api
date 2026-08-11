import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const orderItemSchema = z.object({
  menuItemId: z.string().cuid(),
  quantity: z.number().int().positive().max(50),
});

export const createOrderSchema = z.object({
  restaurantId: z.string().cuid(),
  deliveryAddress: z.string().min(5),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  items: z.array(orderItemSchema).min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;
