import { Router } from 'express';
import { authRequired, rbac } from '../../middlewares/auth';
import { acceptCtrl, cancelCtrl, createCtrl, finishCtrl, listCtrl, startCtrl } from './controller';
import { createForJobCtrl } from '../reviews/controller';

const router = Router();

// Criar job (cliente)
router.post('/', authRequired, rbac('customer'), createCtrl);

// Listar jobs (por papel)
router.get('/', authRequired, listCtrl);

// Fluxo do prestador
router.post('/:id/accept', authRequired, rbac('provider'), acceptCtrl);
router.post('/:id/start',  authRequired, rbac('provider'), startCtrl);
router.post('/:id/finish', authRequired, rbac('provider'), finishCtrl);

// Review do job (cliente avalia prestador)
router.post('/:id/review', authRequired, rbac('customer'), createForJobCtrl);

// Cancelar (cliente ou prestador)
router.post('/:id/cancel', authRequired, cancelCtrl);

export default router;
