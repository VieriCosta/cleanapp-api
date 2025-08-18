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

// Lista conversas do usuário autenticado
router.get('/', authRequired, listCtrl);

// Detalhe de uma conversa
router.get('/:id', authRequired, detailCtrl);

// Mensagens da conversa
router.get('/:id/messages', authRequired, listMessagesCtrl);

// Enviar mensagem
router.post('/:id/messages', authRequired, sendMessageCtrl);

// Marcar todas como lidas
router.post('/:id/messages/mark-all-read', authRequired, markAllReadCtrl);

export default router;
