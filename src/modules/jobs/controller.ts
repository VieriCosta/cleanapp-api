import { Request, Response } from 'express';
import { z } from 'zod';
import * as Jobs from './service';
import { JobStatus } from '@prisma/client';

const createSchema = z.object({
  offerId: z.string().uuid(),
  addressId: z.string().uuid(),
  datetime: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'datetime inválido (ISO)'),
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
  status: z.nativeEnum(JobStatus).optional(),
  page: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  pageSize: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
});

export async function listCtrl(req: Request, res: Response) {
  const q = listSchema.parse(req.query);
  const userId = (req as any).user?.id as string;

  const result = await Jobs.listJobs({
    userId,
    role: q.role,
    status: q.status,
    page: q.page,
    pageSize: q.pageSize,
  });

  res.status(200).json(result);
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
  const updated = await Jobs.cancelJob({ jobId, userId: user.id, role: user.role, reason: body.reason });
  res.status(200).json({ job: updated });
}

export async function finishCtrl(req: Request, res: Response) {
  const providerId = (req as any).user?.id as string;
  const jobId = req.params.id;
  const updated = await Jobs.finishJob({ jobId, providerId });
  res.status(200).json({ job: updated });
}
