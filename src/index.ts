import 'dotenv/config';
import http from 'http';
import { buildApp } from './app';
import { initSocket } from './realtime/socket';
import { logger } from './lib/logger';

const app = buildApp();
const server = http.createServer(app);

const PORT = Number(process.env.PORT || 3000);

initSocket(server);

server.listen(PORT, () => {
  logger.info({ port: PORT }, 'HTTP server started');
});

export { app, server };
