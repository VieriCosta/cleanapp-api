import bcrypt from 'bcryptjs';
import { prisma } from '../../db/client';

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true, phone: true,
      photoUrl: true, createdAt: true
    }
  });
  if (!user) throw { status: 404, code: 'USER_NOT_FOUND' };
  return user;
}

export async function updateMe(userId: string, data: { name?: string; phone?: string }) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name != null ? { name: data.name } : {}),
      ...(data.phone != null ? { phone: data.phone } : {}),
    },
  });
  return getMe(userId);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, code: 'USER_NOT_FOUND' };

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) throw { status: 400, code: 'INVALID_PASSWORD', message: 'Senha atual incorreta' };

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hash } });
}
