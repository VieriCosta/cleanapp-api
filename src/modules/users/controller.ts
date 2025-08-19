import { Request, Response } from 'express';
import { z } from 'zod';
import * as Svc from './service';

export async function meCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const user = await Svc.getMe(userId);
  res.status(200).json({ user });
}

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(8).max(20).optional(),
});

export async function updateMeCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const body = updateSchema.parse(req.body);
  const user = await Svc.updateMe(userId, body);
  res.status(200).json({ user });
}

const changePwdSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export async function changePasswordCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const body = changePwdSchema.parse(req.body);
  await Svc.changePassword(userId, body.currentPassword, body.newPassword);
  res.status(200).json({ ok: true });
}
