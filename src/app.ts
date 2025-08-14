import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { openapiSpec } from './docs/openapi';
import { correlationId } from './middlewares/correlation-id';
import { logger } from './lib/logger';
import { errorHandler } from './middlewares/erro-handler';

export function buildApp() {
  const app = express();

  // middlewares globais
  app.use(helmet());
  app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(correlationId);

  // swagger
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { explorer: true }));

  // log simples (dev)
  app.use((req, _res, next) => {
    logger.info(
      { method: req.method, url: req.url, correlationId: (req as any).correlationId },
      'req_in'
    );
    next();
  });

  // rotas da API
  app.use('/api', routes);

  // 404
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada' } });
  });

  // error handler (por último)
  app.use(errorHandler);

  return app;
}
