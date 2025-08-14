import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function correlationId(req: Request, res: Response, next: NextFunction) {
  const headerName = 'x-correlation-id';
  const cid = (req.headers[headerName] as string) || randomUUID();
  (req as any).correlationId = cid;
  res.setHeader(headerName, cid);
  next();
}