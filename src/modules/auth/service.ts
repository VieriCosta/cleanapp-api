import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './tokens';

const prisma = new PrismaClient();

export async function register(params: { name: string; email: string; password: string; role?: 'customer' | 'provider' }) {
  const { name, email, password } = params;
  const role = params.role ?? 'customer';

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw { status: 409, code: 'EMAIL_IN_USE', message: 'E-mail já cadastrado' };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, password: passwordHash, role } });

  const accessToken = signAccessToken(user.id, user.role as any);
  const refreshToken = signRefreshToken(user.id, user.role as any);

  return { user: sanitize(user), accessToken, refreshToken };
}

export async function login(params: { email: string; password: string }) {
  const { email, password } = params;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas' };

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas' };

  const accessToken = signAccessToken(user.id, user.role as any);
  const refreshToken = signRefreshToken(user.id, user.role as any);

  return { user: sanitize(user), accessToken, refreshToken };
}

export async function refresh(params: { refreshToken: string }) {
  const payload = verifyRefreshToken(params.refreshToken);
  if (payload.type !== 'refresh') throw { status: 401, code: 'INVALID_TOKEN' };

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw { status: 401, code: 'INVALID_TOKEN' };

  const accessToken = signAccessToken(user.id, user.role as any);
  const newRefreshToken = signRefreshToken(user.id, user.role as any);

  return { accessToken, refreshToken: newRefreshToken };
}

function sanitize(u: any) {
  const { password, ...rest } = u;
  return rest;
}
