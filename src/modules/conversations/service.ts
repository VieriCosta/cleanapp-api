import { Prisma } from '@prisma/client';
import { prisma } from '../../db/client';

export type ListParams = { userId: string; page?: number; pageSize?: number };

export async function listConversations({ userId, page = 1, pageSize = 10 }: ListParams) {
  const take = Math.min(50, Math.max(1, pageSize));
  const skip = (Math.max(1, page) - 1) * take;

  const where: Prisma.ConversationWhereInput = {
    job: { OR: [{ customerId: userId }, { providerId: userId }] },
  };

  const [total, rows] = await Promise.all([
    prisma.conversation.count({ where }),
    prisma.conversation.findMany({
      where,
      skip,
      take,
      orderBy: { id: 'desc' },
      include: {
        job: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
            offer: { select: { id: true, title: true } },
            customer: { select: { id: true, name: true } },
            provider: { select: { id: true, name: true } },
          },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
  ]);

  // unreadCount por conversa (mensagens enviadas pelo outro participante)
  const withUnread = await Promise.all(
    rows.map(async (c) => {
      const unreadCount = await prisma.message.count({
        where: { conversationId: c.id, senderId: { not: userId }, read: false },
      });
      return { ...c, unreadCount };
    }),
  );

  return { total, page, pageSize: take, items: withUnread };
}

export async function ensureAccess(userId: string, conversationId: string) {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      job: {
        include: {
          category: { select: { id: true, name: true, slug: true } },
          offer: { select: { id: true, title: true } },
          customer: { select: { id: true, name: true } },
          provider: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!conv) throw { status: 404, code: 'CONVERSATION_NOT_FOUND' };

  const isParticipant =
    conv.job.customerId === userId ||
    (conv.job.providerId != null && conv.job.providerId === userId);

  if (!isParticipant) throw { status: 403, code: 'FORBIDDEN' };

  return conv;
}

export async function listMessages(userId: string, conversationId: string, page = 1, pageSize = 20) {
  await ensureAccess(userId, conversationId);

  const take = Math.min(100, Math.max(1, pageSize));
  const skip = (Math.max(1, page) - 1) * take;

  // marca recebidas como lidas (best-effort)
  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: userId }, read: false },
    data: { read: true },
  });

  const [total, items] = await Promise.all([
    prisma.message.count({ where: { conversationId } }),
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    }),
  ]);

  return { total, page, pageSize: take, items };
}

export async function sendMessage(userId: string, conversationId: string, text: string) {
  // garante acesso (lança erro se não tiver)
  await ensureAccess(userId, conversationId);

  const saved = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      content: text,
      read: false,
    },
  });

  // Emissão em tempo real deve ser feita no controller (se desejado)
  return saved;
}

export async function markAllRead(userId: string, conversationId: string) {
  // garante que o usuário participa da conversa
  await ensureAccess(userId, conversationId);

  // marca mensagens recebidas (do outro usuário) como lidas
  const res = await prisma.message.updateMany({
    where: { conversationId, senderId: { not: userId }, read: false },
    data: { read: true },
  });

  // Emissão em tempo real (ex.: atualizar unreadCount) pode ser feita no controller
  return { updated: res.count };
}
