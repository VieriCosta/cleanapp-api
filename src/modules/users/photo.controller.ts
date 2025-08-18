import { Request, Response } from 'express';
import { prisma } from '../../db/client';
import path from 'path';
import fs from 'fs/promises';

function buildPublicBase(req: Request) {
  return process.env.APP_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
}

async function tryDeleteLocalByUrl(url: string | null | undefined) {
  if (!url) return;
  try {
    let pathname: string | null = null;

    if (url.startsWith('http')) {
      pathname = new URL(url).pathname;
    } else if (url.startsWith('/')) {
      pathname = url;
    }

    if (!pathname || !pathname.startsWith('/uploads/')) return;

    const abs = path.resolve(path.join('.', pathname));
    await fs.unlink(abs).catch(() => {});
  } catch {
    // ignora
  }
}

export async function uploadMyPhotoCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) {
    return res.status(400).json({ error: { code: 'FILE_REQUIRED', message: 'Arquivo é obrigatório (campo "file").' } });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: { code: 'USER_NOT_FOUND' } });

  // apaga a anterior se for local
  await tryDeleteLocalByUrl(user.photoUrl);

  const base = buildPublicBase(req); // http://localhost:3000 ou APP_PUBLIC_URL
  const publicPath = `/uploads/avatars/${file.filename}`;
  const fullUrl = `${base}${publicPath}`;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { photoUrl: fullUrl },
    select: { id: true, name: true, email: true, role: true, photoUrl: true },
  });

  return res.status(200).json({ user: updated });
}

export async function deleteMyPhotoCtrl(req: Request, res: Response) {
  const userId = (req as any).user.id as string;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: { code: 'USER_NOT_FOUND' } });

  await tryDeleteLocalByUrl(user.photoUrl);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { photoUrl: '' },
    select: { id: true, name: true, email: true, role: true, photoUrl: true },
  });

  return res.status(200).json({ user: updated });
}
