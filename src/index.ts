import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './lib/logger';
import routes from './routes';
import { correlationId } from './middlewares/correlation-id';
import { errorHandler } from './middlewares/erro-handler';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from './docs/openapi';

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Middlewares básicos
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => cb(null, true), // libere tudo no DEV; depois restrinja
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(correlationId);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
  explorer: true,
}));

// Log simples de requisições (DEV)
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url, correlationId: (req as any).correlationId }, 'req_in');
  next();
});

// Prefixo das rotas da API
app.use('/api', routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada' } });
});

// Error handler
app.use(errorHandler);

// Start
app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, 'server_started');
});
