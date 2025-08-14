import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type JwtPayload = { sub: string; role: 'admin' | 'customer' | 'provider'; type: 'access' };

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization;
  if (!hdr || !hdr.startsWith('Bearer '))
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });

  const token = hdr.slice('Bearer '.length);
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
    (req as any).user = { id: decoded.sub, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired' } });
  }
}

export function rbac(...allowed: Array<'admin' | 'customer' | 'provider'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: { code: 'UNAUTHORIZED' } });
    if (!allowed.includes(user.role))
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient role' } });
    next();
  };
}
