import { Request, Response } from 'express';
import { prisma } from '../db/client';

export async function liveness(_req: Request, res: Response) {
  res.status(200).json({ status: 'ok' });
}

export async function readiness(_req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready' });
  } catch (e: any) {
    res.status(500).json({ status: 'not_ready', reason: e?.message ?? 'db_unavailable' });
  }
}