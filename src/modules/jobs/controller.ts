// src/modules/jobs/controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { JobStatus } from '@prisma/client';
import * as Jobs from './service';

// IDs do Prisma são string (podem ser cuid, ids sem formato UUID etc.)
// então usamos .min(1) para aceitar qualquer string não vazia.
const createSchema = z.object({
  offerId: z.string().min(1),
  addressId: z.string().min(1),
  datetime: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'datetime inválido (ISO)'),
  notes: z.string().max(1000).optional(),
});

export async function createCtrl(req: Request, res: Response) {
  const body = createSchema.parse(req.body);
  const customerId = (req as any).user?.id as string;

  const { job, distanceKm } = await Jobs.createJob({
    customerId,
    offerId: body.offerId,
    addressId: body.addressId,
    datetime: new Date(body.datetime),
    notes: body.notes,
  });

  res.status(201).json({ job, distanceKm });
}

const listSchema = z.object({
  role: z.enum(['customer', 'provider']),
  status: z
    .union([
      z.nativeEnum(JobStatus), // "accepted"
      z
        .string()
        .transform((s) => s.split(',').filter(Boolean) as JobStatus[]), // "accepted,in_progress"
      z.array(z.nativeEnum(JobStatus)), // ["accepted","in_progress"]
    ])
    .optional(),
  dateFrom: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  dateTo: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  categoryId: z.string().min(1).optional(), // sem .uuid()
  category: z.string().optional(), // slug
  order: z.enum(['asc', 'desc']).optional(),
  page: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  pageSize: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
});

export async function listCtrl(req: Request, res: Response) {
  const q = listSchema.parse(req.query);
  const userId = (req as any).user?.id as string;

  // Normaliza para array de JobStatus | undefined
  const statuses: JobStatus[] | undefined =
    q.status == null
      ? undefined
      : Array.isArray(q.status)
      ? (q.status as JobStatus[])
      : ([q.status] as JobStatus[]);

  const data = await Jobs.listJobs({
    userId,
    role: q.role,
    statuses,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    categoryId: q.categoryId,
    categorySlug: q.category,
    order: q.order,
    page: q.page,
    pageSize: q.pageSize,
  });

  res.status(200).json(data);
}

export async function acceptCtrl(req: Request, res: Response) {
  const providerId = (req as any).user?.id as string;
  const jobId = req.params.id;
  const updated = await Jobs.acceptJob({ jobId, providerId });
  res.status(200).json({ job: updated });
}

export async function startCtrl(req: Request, res: Response) {
  const providerId = (req as any).user?.id as string;
  const jobId = req.params.id;
  const updated = await Jobs.startJob({ jobId, providerId });
  res.status(200).json({ job: updated });
}

const cancelSchema = z.object({ reason: z.string().max(500).optional() });

export async function cancelCtrl(req: Request, res: Response) {
  const user = (req as any).user!;
  const jobId = req.params.id;
  const body = cancelSchema.parse(req.body);
  const updated = await Jobs.cancelJob({
    jobId,
    userId: user.id,
    role: user.role,
    reason: body.reason,
  });
  res.status(200).json({ job: updated });
}

export async function finishCtrl(req: Request, res: Response) {
  const providerId = (req as any).user?.id as string;
  const jobId = req.params.id;
  const updated = await Jobs.finishJob({ jobId, providerId });
  res.status(200).json({ job: updated });
}
