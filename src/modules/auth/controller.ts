import { Request, Response } from 'express';
import { z } from 'zod';
import * as Auth from './service';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['customer', 'provider']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export async function registerCtrl(req: Request, res: Response) {
  const body = registerSchema.parse(req.body);
  const result = await Auth.register(body);
  return res.status(201).json(result);
}

export async function loginCtrl(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);
  const result = await Auth.login(body);
  return res.status(200).json(result);
}

export async function refreshCtrl(req: Request, res: Response) {
  const body = refreshSchema.parse(req.body);
  const result = await Auth.refresh(body);
  return res.status(200).json(result);
}

export async function logoutCtrl(_req: Request, res: Response) {
  // MVP: stateless – o cliente descarta o refresh token localmente.
  return res.status(204).send();
}
