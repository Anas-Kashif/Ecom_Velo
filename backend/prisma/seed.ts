import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database seeding is disabled in production.');
  }

  if (process.env.ALLOW_DEV_SEED !== 'true') {
    return;
  }

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required when ALLOW_DEV_SEED=true.');
  }

  const name = process.env.SEED_ADMIN_NAME || 'Local Admin';
  const role = process.env.SEED_ADMIN_ROLE || 'ADMIN';
  const hashedPassword = await bcryptjs.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      name,
      role,
      status: 'ACTIVE',
    },
    create: {
      email,
      password: hashedPassword,
      name,
      role,
      status: 'ACTIVE',
    },
  });
}

main()
  .catch(() => {
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
