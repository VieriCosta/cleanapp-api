import { Request, Response } from 'express';
import { z } from 'zod';
import * as Addresses from './service';

export async function listMineCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const items = await Addresses.listMine(userId);
  res.status(200).json({ items });
}

const createSchema = z.object({
  label: z.string().max(60).optional(),
  street: z.string().min(2),
  number: z.string().max(20).optional(),
  district: z.string().max(60).optional(),
  city: z.string().min(2),
  state: z.string().min(2).max(2), // UF
  zip: z.string().min(5).max(15),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  isDefault: z.boolean().optional(),
});

export async function createMineCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const body = createSchema.parse(req.body);

  const created = await Addresses.createMine(userId, body);
  res.status(201).json({ address: created });
}

export async function setDefaultCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const id = req.params.id;
  const updated = await Addresses.setDefaultMine(userId, id);
  res.status(200).json({ address: updated });
}

export async function deleteMineCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const id = req.params.id;
  await Addresses.deleteMine(userId, id);
  res.status(204).send();
}
