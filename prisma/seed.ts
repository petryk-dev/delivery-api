import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('Password1', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@deliveryapp.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@deliveryapp.com',
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@deliveryapp.com' },
    update: {},
    create: {
      name: 'Restaurant Owner',
      email: 'owner@deliveryapp.com',
      passwordHash,
      role: 'DRIVER',
      isVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'customer@deliveryapp.com' },
    update: {},
    create: {
      name: 'Sample Customer',
      email: 'customer@deliveryapp.com',
      passwordHash,
      role: 'CUSTOMER',
      isVerified: true,
    },
  });

  const existingRestaurant = await prisma.restaurant.findFirst({ where: { ownerId: owner.id } });
  const restaurant =
    existingRestaurant ??
    (await prisma.restaurant.create({
      data: {
        ownerId: owner.id,
        name: 'Pasta Palace',
        address: '123 Main St, Springfield',
        lat: 40.7128,
        lng: -74.006,
        cuisineType: 'Italian',
        isOpen: true,
      },
    }));

  const menuItemCount = await prisma.menuItem.count({ where: { restaurantId: restaurant.id } });
  if (menuItemCount === 0) {
    await prisma.menuItem.createMany({
      data: [
        { restaurantId: restaurant.id, name: 'Margherita Pizza', description: 'Tomato, mozzarella, basil', price: 12.99, category: 'Pizza' },
        { restaurantId: restaurant.id, name: 'Spaghetti Carbonara', description: 'Egg, pancetta, parmesan', price: 14.5, category: 'Pasta' },
        { restaurantId: restaurant.id, name: 'Tiramisu', description: 'Classic Italian dessert', price: 6.5, category: 'Dessert' },
      ],
    });
  }

  console.log('Seed complete:');
  console.log(`  Admin:    ${admin.email} / Password1`);
  console.log(`  Owner:    ${owner.email} / Password1`);
  console.log('  Customer: customer@deliveryapp.com / Password1');
  console.log(`  Restaurant: ${restaurant.name} (${restaurant.id})`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
