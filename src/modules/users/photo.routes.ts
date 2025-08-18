import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import { uploadAvatar } from '../../middlewares/upload-avatar';
import { uploadMyPhotoCtrl, deleteMyPhotoCtrl } from './photo.controller';

const router = Router();

// POST /api/users/me/photo  (form-data: file=<arquivo>)
router.post('/me/photo', authRequired, uploadAvatar.single('file'), uploadMyPhotoCtrl);

// DELETE /api/users/me/photo
router.delete('/me/photo', authRequired, deleteMyPhotoCtrl);

export default router;
