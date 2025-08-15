// src/modules/conversations/controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import * as Conv from './service';
import { emitMessageNew, emitConversationUpdated } from '../../realtime/socket';

/** GET /conversations */
export async function listCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;

  // page e pageSize chegam como string na query
  const page = req.query.page ? Number(req.query.page) : 1;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;

  const data = await Conv.listConversations({ userId, page, pageSize });
  res.status(200).json(data);
}

/** GET /conversations/:id */
export async function detailCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const conv = await Conv.ensureAccess(userId, req.params.id);
  res.status(200).json({ conversation: conv });
}

const listMsgsSchema = z.object({
  page: z.string().optional().transform((v) => (v ? Number(v) : 1)),
  pageSize: z.string().optional().transform((v) => (v ? Number(v) : 20)),
});

/** GET /conversations/:id/messages */
export async function listMessagesCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { page, pageSize } = listMsgsSchema.parse(req.query);
  const data = await Conv.listMessages(userId, req.params.id, page, pageSize);
  res.status(200).json(data);
}

// o front envia { text: string }
const sendSchema = z.object({ text: z.string().min(1).max(5_000) });

/** POST /conversations/:id/messages */
export async function sendMessageCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const conversationId = req.params.id;
  const { text } = sendSchema.parse(req.body);

  // cria mensagem via service (também valida acesso)
  const message = await Conv.sendMessage({ userId, conversationId, text });

  // emite em tempo real para quem está na sala dessa conversa
  emitMessageNew(conversationId, message);
  emitConversationUpdated(conversationId, { lastMessageAt: message.createdAt });

  res.status(201).json({ message });
}

/** POST /conversations/:id/read-all */
export async function markAllReadCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const conversationId = req.params.id;

  const result = await Conv.markAllRead(userId, conversationId);

  // notifica clientes conectados que zerou as não lidas
  emitConversationUpdated(conversationId, { unreadCount: 0 });

  res.status(200).json(result); // { updated: number }
}
