import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import { detailCtrl, listCtrl, listMessagesCtrl, markReadCtrl, sendMessageCtrl } from './controller';

const router = Router();

router.get('/', authRequired, listCtrl);
router.get('/:id', authRequired, detailCtrl);
router.get('/:id/messages', authRequired, listMessagesCtrl);
router.post('/:id/messages', authRequired, sendMessageCtrl);
router.post('/:id/read', authRequired, markReadCtrl);

export default router;
