import { Request, Response } from 'express';
import { z } from 'zod';
import * as Conv from './service';

export async function listCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const page = req.query.page ? Number(req.query.page) : 1;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;

  const data = await Conv.listConversations({ userId, page, pageSize });
  res.status(200).json(data);
}

export async function detailCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const conv = await Conv.ensureAccess(userId, req.params.id);
  res.status(200).json({ conversation: conv });
}

const listMsgsSchema = z.object({
  page: z.string().optional().transform(v => (v ? Number(v) : 1)),
  pageSize: z.string().optional().transform(v => (v ? Number(v) : 20)),
});

export async function listMessagesCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { page, pageSize } = listMsgsSchema.parse(req.query);
  const data = await Conv.listMessages(userId, req.params.id, page, pageSize);
  res.status(200).json(data);
}

const sendSchema = z.object({ content: z.string().min(1).max(5_000) });

export async function sendMessageCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { content } = sendSchema.parse(req.body);
  const msg = await Conv.sendMessage(userId, req.params.id, content);
  res.status(201).json({ message: msg });
}

export async function markReadCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const result = await Conv.markAllRead(userId, req.params.id);
  res.status(200).json(result);
}
