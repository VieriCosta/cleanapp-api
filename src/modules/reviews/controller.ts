import { Request, Response } from 'express';
import { z } from 'zod';
import * as Reviews from './service';

const postSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export async function createForJobCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string; // cliente
  const jobId = req.params.id;
  const body = postSchema.parse(req.body);

  const review = await Reviews.createOrUpdateForJob({
    jobId,
    customerId: userId,
    rating: body.rating,
    comment: body.comment,
  });

  res.status(201).json({ review });
}

const listSchema = z.object({
  page: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  pageSize: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
});

export async function listForUserCtrl(req: Request, res: Response) {
  const userId = req.params.id; // prestador (ratee)
  const q = listSchema.parse(req.query);
  const data = await Reviews.listForUser({
    userId,
    page: q.page,
    pageSize: q.pageSize,
  });
  res.status(200).json(data);
}
