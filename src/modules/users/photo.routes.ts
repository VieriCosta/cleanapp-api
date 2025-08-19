import { Router } from 'express';
import path from 'path';
import { authRequired } from '../../middlewares/auth';
import { uploadAvatar } from '../../middlewares/upload-avatar';
import { prisma } from '../../db/client';

const router = Router();

router.post('/me/photo', authRequired, uploadAvatar.single('file'), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: { code: 'FILE_REQUIRED' } });

  const rel = `/uploads/avatars/${req.file.filename}`;
  await prisma.user.update({ where: { id: req.user.id }, data: { photoUrl: rel } });
  res.status(200).json({ ok: true, photoUrl: rel });
});

// servir arquivos estáticos
router.use('/uploads/avatars', (req, res, next) => {
  const abs = path.join(process.cwd(), req.baseUrl.replace(/\/+$/, ''), req.path);
  res.sendFile(abs, (err) => err && next());
});

export default router;
