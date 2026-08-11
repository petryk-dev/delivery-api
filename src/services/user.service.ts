import createError from 'http-errors';
import { prisma } from '../config/database';
import { UpdateUserDto } from '../validators/user.validator';

const safeSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: safeSelect,
  });
  if (!user) throw createError(404, 'User not found');
  return user;
}

export async function updateMe(userId: string, dto: UpdateUserDto) {
  return prisma.user.update({
    where: { id: userId },
    data: dto,
    select: safeSelect,
  });
}

export async function deleteMe(userId: string): Promise<void> {
  await prisma.user.delete({ where: { id: userId } });
}
