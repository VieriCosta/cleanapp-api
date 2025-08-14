// src/modules/auth/tokens.ts
import jwt, { JwtPayload, SignOptions, Secret } from 'jsonwebtoken';

const accessEnv  = process.env.JWT_ACCESS_SECRET;
const refreshEnv = process.env.JWT_REFRESH_SECRET;

if (!accessEnv)  throw new Error('JWT_ACCESS_SECRET ausente no .env');
if (!refreshEnv) throw new Error('JWT_REFRESH_SECRET ausente no .env');

// Narrowing pro tipo aceito pelo jsonwebtoken
const ACCESS_SECRET: Secret  = accessEnv;
const REFRESH_SECRET: Secret = refreshEnv;

// Usamos string | number para evitar conflitos com o tipo ms.StringValue das typings
const ACCESS_EXPIRES: string | number  = process.env.JWT_ACCESS_EXPIRES  ?? '15m';
const REFRESH_EXPIRES: string | number = process.env.JWT_REFRESH_EXPIRES ?? '7d';

export type TokenRole = 'customer' | 'provider' | 'admin';

export type TokenPayload = {
  sub: string;   // userId
  role: TokenRole;
};

// ---- Assinatura (payload objeto) ----
export function signAccess(payload: TokenPayload, opts: SignOptions = {}): string {
  const baseOpts: SignOptions = { expiresIn: ACCESS_EXPIRES as any };
  return jwt.sign(payload, ACCESS_SECRET, { ...baseOpts, ...(opts as any) } as SignOptions);
}

export function signRefresh(payload: TokenPayload, opts: SignOptions = {}): string {
  const baseOpts: SignOptions = { expiresIn: REFRESH_EXPIRES as any };
  return jwt.sign(payload, REFRESH_SECRET, { ...baseOpts, ...(opts as any) } as SignOptions);
}

// ---- Verificação ----
// Cast via unknown para casar com o payload que nós assinamos { sub, role }
export function verifyAccess(token: string): TokenPayload & JwtPayload {
  const decoded = jwt.verify(token, ACCESS_SECRET as Secret) as unknown as (JwtPayload & TokenPayload);
  return decoded;
}

export function verifyRefresh(token: string): TokenPayload & JwtPayload {
  const decoded = jwt.verify(token, REFRESH_SECRET as Secret) as unknown as (JwtPayload & TokenPayload);
  return decoded;
}

// ---- Aliases compatíveis com o service.ts (assinatura antiga: (userId, role)) ----
export function signAccessToken(userId: string, role: TokenRole, opts: SignOptions = {}): string {
  return signAccess({ sub: userId, role }, opts);
}

export function signRefreshToken(userId: string, role: TokenRole, opts: SignOptions = {}): string {
  return signRefresh({ sub: userId, role }, opts);
}

export const verifyAccessToken  = verifyAccess;
export const verifyRefreshToken = verifyRefresh;
