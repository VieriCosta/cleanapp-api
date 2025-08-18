import { Request, Response } from 'express';
import { z } from 'zod';
import * as Conv from './service';
import { emitMessageNew, emitConversationUpdated } from '../../realtime/socket';

// helper para pegar o ID da conversa com segurança
function getConvId(req: Request): string {
  const id =
    (req.params as any).id ??
    (req.params as any).conversationId ??
    (req.params as any).cid;
  return id as string;
}

export async function listCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const page = req.query.page ? Number(req.query.page) : 1;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;

  const data = await Conv.listConversations({ userId, page, pageSize });
  res.status(200).json(data);
}

export async function detailCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const conversationId = getConvId(req);
  if (!conversationId) {
    return res.status(400).json({ code: 'INVALID_CONVERSATION_ID' });
  }
  const conv = await Conv.ensureAccess(userId, conversationId);
  res.status(200).json({ conversation: conv });
}

const listMsgsSchema = z.object({
  page: z.string().optional().transform((v) => (v ? Number(v) : 1)),
  pageSize: z.string().optional().transform((v) => (v ? Number(v) : 20)),
});

export async function listMessagesCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const conversationId = getConvId(req);
  if (!conversationId) {
    return res.status(400).json({ code: 'INVALID_CONVERSATION_ID' });
  }
  const { page, pageSize } = listMsgsSchema.parse(req.query);

  // garante acesso (evita vazar mensagens)
  await Conv.ensureAccess(userId, conversationId);

  const data = await Conv.listMessages(userId, conversationId, page, pageSize);
  res.status(200).json(data);
}

const sendSchema = z.object({ text: z.string().min(1).max(5_000) });

export async function sendMessageCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const conversationId = getConvId(req);
  if (!conversationId) {
    return res.status(400).json({ code: 'INVALID_CONVERSATION_ID' });
  }
  const { text } = sendSchema.parse(req.body);

  // valida acesso + cria mensagem
  const message = await Conv.sendMessage(userId, conversationId, text);

  // realtime
  emitMessageNew(conversationId, message);
  emitConversationUpdated(conversationId, { lastMessageAt: message.createdAt });

  return res.status(201).json({ message });
}

export async function markAllReadCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const conversationId = getConvId(req);
  if (!conversationId) {
    return res.status(400).json({ code: 'INVALID_CONVERSATION_ID' });
  }

  // garante acesso
  await Conv.ensureAccess(userId, conversationId);

  const result = await Conv.markAllRead(userId, conversationId);

  emitConversationUpdated(conversationId, { unreadCount: 0 });

  return res.status(200).json(result); // { updated: <qtd> }
}
