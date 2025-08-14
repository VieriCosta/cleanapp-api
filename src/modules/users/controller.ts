import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getMeCtrl(req: Request, res: Response) {
  const userId = (req as any).user?.id as string;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: { code: 'USER_NOT_FOUND' } });
  const { password, ...safe } = user;
  return res.status(200).json({ user: safe });
}
