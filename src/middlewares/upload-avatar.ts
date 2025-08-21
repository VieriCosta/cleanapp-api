import multer from 'multer';
import path from 'path';
import fs from 'fs';

const AVATARS_DIR = path.resolve('uploads', 'avatars');

function ensureDirSync(dir: string) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {}
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    ensureDirSync(AVATARS_DIR);
    cb(null, AVATARS_DIR);
  },
  filename(req: any, file, cb) {
    const userId = req?.user?.id ?? 'anon';
    const ext = path.extname(file.originalname) || (file.mimetype === 'image/png' ? '.png' : '.jpg');
    const name = `${userId}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
  if (!ok) return cb(new Error('INVALID_FILE_TYPE'));
  cb(null, true);
}

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});
