import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import { getMeCtrl } from './controller';

const router = Router();

router.get('/me', authRequired, getMeCtrl);

export default router;
