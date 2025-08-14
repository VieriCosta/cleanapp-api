import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function listActive() {
  return prisma.serviceCategory.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });
}
