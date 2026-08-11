import createError from 'http-errors';
import { MenuItem } from '@prisma/client';
import { prisma } from '../config/database';
import { CreateMenuItemDto, UpdateMenuItemDto } from '../validators/menu.validator';

async function assertOwner(restaurantId: string, requesterId: string, requesterRole: string) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw createError(404, 'Restaurant not found');
  if (requesterRole !== 'ADMIN' && restaurant.ownerId !== requesterId) {
    throw createError(403, 'Insufficient permissions');
  }
}

export async function listMenu(restaurantId: string): Promise<MenuItem[]> {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw createError(404, 'Restaurant not found');
  return prisma.menuItem.findMany({ where: { restaurantId } });
}

export async function createMenuItem(
  restaurantId: string,
  requesterId: string,
  requesterRole: string,
  dto: CreateMenuItemDto,
): Promise<MenuItem> {
  await assertOwner(restaurantId, requesterId, requesterRole);
  return prisma.menuItem.create({ data: { ...dto, restaurantId, price: dto.price } });
}

export async function updateMenuItem(
  restaurantId: string,
  itemId: string,
  requesterId: string,
  requesterRole: string,
  dto: UpdateMenuItemDto,
): Promise<MenuItem> {
  await assertOwner(restaurantId, requesterId, requesterRole);
  const item = await prisma.menuItem.findFirst({ where: { id: itemId, restaurantId } });
  if (!item) throw createError(404, 'Menu item not found');
  return prisma.menuItem.update({ where: { id: itemId }, data: dto });
}

export async function deleteMenuItem(
  restaurantId: string,
  itemId: string,
  requesterId: string,
  requesterRole: string,
): Promise<void> {
  await assertOwner(restaurantId, requesterId, requesterRole);
  const item = await prisma.menuItem.findFirst({ where: { id: itemId, restaurantId } });
  if (!item) throw createError(404, 'Menu item not found');
  await prisma.menuItem.delete({ where: { id: itemId } });
}
