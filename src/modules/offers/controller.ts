import { Request, Response } from 'express';
import { z } from 'zod';
import * as Offers from './service';
import { Unit } from '@prisma/client';

const querySchema = z.object({
  category: z.string().optional(),          // slug ou id? Usaremos como slug
  categoryId: z.string().uuid().optional(), // se preferir passar id
  near: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return undefined;
      const [latStr, lngStr] = v.split(',').map((s) => s.trim());
      const lat = Number(latStr);
      const lng = Number(lngStr);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        throw new Error('near inválido. Use: near=LAT,LNG');
      }
      return { lat, lng };
    }),
  radius: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((n) => n == null || (!Number.isNaN(n) && n > 0), {
      message: 'radius deve ser número > 0',
    }),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
  pageSize: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
});

export async function listCtrl(req: Request, res: Response) {
  const q = querySchema.parse(req.query);

  const result = await Offers.list({
    categoryId: q.categoryId,
    categorySlug: q.category,
    near: q.near,
    radiusKm: q.radius,
    page: q.page,
    pageSize: q.pageSize,
  });

  res.status(200).json(result);
}

// -------- detalhe --------
export async function detailCtrl(req: Request, res: Response) {
  const data = await Offers.detail(req.params.id);
  res.status(200).json({ offer: data });
}

// -------- criar --------
const createSchema = z.object({
  title: z.string().min(2).max(80),
  description: z.string().max(2000).optional(),
  priceBase: z.number().positive(),
  unit: z.nativeEnum(Unit),
  categoryId: z.string().uuid().optional(),
  categorySlug: z.string().optional(),
  active: z.boolean().optional(),
});

export async function createCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const body = createSchema.parse(req.body);
  const created = await Offers.create(userId, body);
  res.status(201).json({ offer: created });
}

// -------- atualizar --------
const updateSchema = z.object({
  title: z.string().min(2).max(80).optional(),
  description: z.string().max(2000).optional(),
  priceBase: z.number().positive().optional(),
  unit: z.nativeEnum(Unit).optional(),
  categoryId: z.string().uuid().optional(),
  categorySlug: z.string().optional(),
  active: z.boolean().optional(),
});

export async function updateCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const body = updateSchema.parse(req.body);
  const updated = await Offers.update(userId, req.params.id, body);
  res.status(200).json({ offer: updated });
}

// -------- deletar --------
export async function deleteCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  await Offers.remove(userId, req.params.id);
  res.status(204).send();
}
