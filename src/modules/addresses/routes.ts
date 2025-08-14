import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import { createMineCtrl, listMineCtrl, setDefaultCtrl, deleteMineCtrl } from './controller';

const router = Router();

// do próprio usuário (token obrigatório)
router.get('/me/addresses', authRequired, listMineCtrl);
router.post('/me/addresses', authRequired, createMineCtrl);
router.patch('/me/addresses/:id/default', authRequired, setDefaultCtrl);
router.delete('/me/addresses/:id', authRequired, deleteMineCtrl);

export default router;
