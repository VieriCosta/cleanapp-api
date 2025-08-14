import { Request, Response } from 'express';
import { z } from 'zod';
import * as Categories from './service';

export async function listCtrl(_req: Request, res: Response) {
  const items = await Categories.listActive();
  res.status(200).json({ items });
}

export async function listAllCtrl(_req: Request, res: Response) {
  const items = await Categories.listAll();
  res.status(200).json({ items });
}

export async function detailCtrl(req: Request, res: Response) {
  const item = await Categories.detail(req.params.id);
  res.status(200).json({ category: item });
}

const createSchema = z.object({
  name: z.string().min(2).max(60),
  slug: z.string().min(2).max(60).optional(),
  active: z.boolean().optional(),
});

export async function createCtrl(req: Request, res: Response) {
  const body = createSchema.parse(req.body);
  const item = await Categories.create(body);
  res.status(201).json({ category: item });
}

const updateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  slug: z.string().min(2).max(60).optional(),
  active: z.boolean().optional(),
});

export async function updateCtrl(req: Request, res: Response) {
  const body = updateSchema.parse(req.body);
  const item = await Categories.update(req.params.id, body);
  res.status(200).json({ category: item });
}

export async function deleteCtrl(req: Request, res: Response) {
  await Categories.remove(req.params.id);
  res.status(204).send();
}
