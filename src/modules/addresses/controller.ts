import { Request, Response } from 'express';
import { z } from 'zod';
import * as S from './service';

export async function listCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const items = await S.listMine(userId);
  res.status(200).json({ total: items.length, items });
}

const createSchema = z.object({
  label: z.string().optional().nullable(),
  street: z.string().min(1),
  number: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  isDefault: z.boolean().optional(),
});

export async function createCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const payload = createSchema.parse(req.body);
  const address = await S.create(userId, payload);
  res.status(201).json(address);
}

export async function setDefaultCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const id = req.params.id;
  const result = await S.setDefault(userId, id);
  res.status(200).json(result);
}

export async function deleteCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const id = req.params.id;
  const result = await S.remove(userId, id);
  res.status(200).json(result);
}
