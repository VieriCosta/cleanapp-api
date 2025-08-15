// src/modules/conversations/routes.ts
import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import {
  listCtrl,
  detailCtrl,
  listMessagesCtrl,
  sendMessageCtrl,
  markAllReadCtrl,
} from './controller';

const router = Router();

// todas as rotas exigem auth
router.use(authRequired);

// NUNCA chame os controllers (não use parênteses)
router.get('/', listCtrl);
router.get('/:id', detailCtrl);
router.get('/:id/messages', listMessagesCtrl);
router.post('/:id/messages', sendMessageCtrl);
router.post('/:id/read-all', markAllReadCtrl);

export default router;
