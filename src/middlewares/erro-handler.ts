import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = Number(err.status || err.statusCode) || 500;
  const code = err.code ?? 'INTERNAL_ERROR';
  const message = err.message ?? 'Unexpected error';
  const correlationId = (req as any).correlationId;

  logger.error({ err, code, status, correlationId }, 'request_error');

  res.status(status).json({
    error: { code, message, details: err.details, correlationId },
  });
}
