import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../lib/logger';

type Role = 'admin' | 'customer' | 'provider';
type JwtPayload = { sub: string; role: Role; type: 'access' };

let io: Server | null = null;

export function initSocket(httpServer: any) {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // Auth no handshake (Bearer no auth.token ou no header)
  io.use((socket, next) => {
    const authToken =
      (socket.handshake.auth && (socket.handshake.auth as any).token) ||
      (socket.handshake.headers['authorization'] as string | undefined);

    const token = authToken?.replace(/^Bearer\s+/i, '');
    if (!token) return next(new Error('UNAUTHORIZED'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
      (socket as any).user = { id: decoded.sub, role: decoded.role };
      next();
    } catch {
      next(new Error('INVALID_TOKEN'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user;
    logger.info({ userId: user.id }, 'socket connected');

    // Cliente decide quais conversas acompanhar
    socket.on('conversations:join', (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('conversations:leave', (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on('disconnect', () => {
      logger.info({ userId: user.id }, 'socket disconnected');
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

export function emitToConversation(conversationId: string, event: string, payload: any) {
  if (!io) return;
  io.to(`conv:${conversationId}`).emit(event, payload);
}
