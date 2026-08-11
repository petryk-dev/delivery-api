import createError from 'http-errors';
import { Prisma, Restaurant } from '@prisma/client';
import { prisma } from '../config/database';
import { buildPaginated } from '../utils/response';
import { PaginatedResponse } from '../types';
import {
  CreateRestaurantDto,
  UpdateRestaurantDto,
  RestaurantQueryDto,
} from '../validators/restaurant.validator';

export async function listRestaurants(
  query: RestaurantQueryDto,
): Promise<PaginatedResponse<Restaurant>> {
  const { page, limit, cuisineType, isOpen, search } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.RestaurantWhereInput = {
    ...(cuisineType && { cuisineType }),
    ...(isOpen !== undefined && { isOpen }),
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.restaurant.findMany({ where, skip, take: limit, orderBy: { rating: 'desc' } }),
    prisma.restaurant.count({ where }),
  ]);

  return buildPaginated(items, total, page, limit);
}

export async function getRestaurant(id: string): Promise<Restaurant> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: { menuItems: { where: { isAvailable: true } } },
  });
  if (!restaurant) throw createError(404, 'Restaurant not found');
  return restaurant;
}

export async function createRestaurant(
  ownerId: string,
  dto: CreateRestaurantDto,
): Promise<Restaurant> {
  return prisma.restaurant.create({ data: { ...dto, ownerId } });
}

export async function updateRestaurant(
  id: string,
  requesterId: string,
  requesterRole: string,
  dto: UpdateRestaurantDto,
): Promise<Restaurant> {
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) throw createError(404, 'Restaurant not found');
  if (requesterRole !== 'ADMIN' && restaurant.ownerId !== requesterId) {
    throw createError(403, 'Insufficient permissions');
  }
  return prisma.restaurant.update({ where: { id }, data: dto });
}

export async function deleteRestaurant(
  id: string,
  requesterId: string,
  requesterRole: string,
): Promise<void> {
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) throw createError(404, 'Restaurant not found');
  if (requesterRole !== 'ADMIN' && restaurant.ownerId !== requesterId) {
    throw createError(403, 'Insufficient permissions');
  }
  await prisma.restaurant.delete({ where: { id } });
}
