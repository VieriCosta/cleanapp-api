import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import * as Ctrl from './controller';

const router = Router();

router.get('/me', authRequired, Ctrl.meCtrl);
router.patch('/me', authRequired, Ctrl.updateMeCtrl);
router.post('/me/change-password', authRequired, Ctrl.changePasswordCtrl);

export default router;
