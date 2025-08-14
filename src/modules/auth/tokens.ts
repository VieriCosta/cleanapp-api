import jwt from 'jsonwebtoken';

type Role = 'admin' | 'customer' | 'provider';

export function signAccessToken(userId: string, role: Role) {
  return jwt.sign({ type: 'access', role }, process.env.JWT_ACCESS_SECRET!, {
    subject: userId,
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
}

export function signRefreshToken(userId: string, role: Role) {
  return jwt.sign({ type: 'refresh', role }, process.env.JWT_REFRESH_SECRET!, {
    subject: userId,
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
    sub: string; role: Role; type: 'refresh';
  };
}
