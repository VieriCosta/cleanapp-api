// src/realtime/socket.ts
import http from 'http';
import { Server } from 'socket.io';
import { verifyAccessToken } from '../modules/auth/tokens';
import { logger } from '../lib/logger';

let io: Server | null = null;

export function initSocket(server: http.Server) {
  io = new Server(server, {
    cors: { origin: true, credentials: true },
  });

  io.on('connection', (socket) => {
    const token = (socket.handshake.auth?.token ?? '') as string;
    let userId: string | null = null;

    try {
      if (token) userId = verifyAccessToken(token).sub;
    } catch {
      // segue anônimo (só não vai conseguir ações autenticadas)
    }

    logger.info({ sid: socket.id, userId }, 'socket_connected');

    // cliente entra numa sala da conversa
    socket.on('conversations:join', (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('disconnect', () => {
      logger.info({ sid: socket.id }, 'socket_disconnected');
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}

// helpers para emitir eventos
export function emitMessageNew(conversationId: string, message: any) {
  io?.to(`conv:${conversationId}`).emit('message:new', { conversationId, message });
}
export function emitConversationUpdated(conversationId: string, patch: any) {
  io?.to(`conv:${conversationId}`).emit('conversation:updated', { conversationId, ...patch });
}
