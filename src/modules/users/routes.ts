import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import { getMeCtrl } from './controller';
import { listForUserCtrl } from '../reviews/controller';

const router = Router();

router.get('/me', authRequired, getMeCtrl);
router.get('/:id/reviews', listForUserCtrl);

export default router;
