import { Request, Response } from 'express';
import { z } from 'zod';
import * as Offers from './service';

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
