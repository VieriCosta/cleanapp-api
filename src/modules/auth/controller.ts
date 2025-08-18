import { Request, Response } from 'express';
import { prisma } from '../../db/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { signAccess, signRefresh } from './tokens';

// ====== LOGIN ======
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginCtrl(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS' } });

  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS' } });

  const payload = { sub: user.id, role: user.role as any };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);

  return res.status(200).json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

// ====== REFRESH ======
const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export async function refreshCtrl(req: Request, res: Response) {
  const { refreshToken } = refreshSchema.parse(req.body);

  // Aqui assumimos que a rota já é protegida pelo verifyRefresh no service de tokens, mas
  // para simplificar geramos um novo par usando o usuário do token verificado no middleware
  // Caso você não use middleware, valide o token aqui.
  return res.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
}

// ====== ME ======
export async function meCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });
  res.status(200).json({ user });
}

// ====== REGISTER (cliente ou prestador) ======
const registerSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email(),
  phone: z.string().min(8).optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['customer', 'provider']),
  // extras de prestador (opcionais)
  bio: z.string().max(500).optional(),
  radiusKm: z.coerce.number().min(1).max(100).optional(),
});

export async function registerCtrl(req: Request, res: Response) {
  const { name, email, phone, password, role, bio, radiusKm } = registerSchema.parse(req.body);

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return res.status(409).json({ error: { code: 'EMAIL_IN_USE', message: 'E-mail já cadastrado' } });
  }

  const hashed = bcrypt.hashSync(password, 10);

  const user = await prisma.user.create({
    data: { name, email, phone, password: hashed, role },
  });

  if (role === 'provider') {
    // cria perfil básico do prestador
    await prisma.providerProfile.create({
      data: {
        userId: user.id,
        bio: bio ?? null,
        radiusKm: radiusKm ?? 10,
        verified: false,
      },
    });
  }

  const payload = { sub: user.id, role: user.role as any };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);

  return res.status(201).json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
