import { Router } from 'express';
import { authRequired, rbac } from '../../middlewares/auth';
import { listCtrl } from './controller';
import { createCtrl, updateCtrl, deleteCtrl, detailCtrl } from './controller';

const router = Router();

// público
router.get('/', listCtrl);
router.get('/:id', detailCtrl);

// provider
router.post('/', authRequired, rbac('provider'), createCtrl);
router.put('/:id', authRequired, rbac('provider'), updateCtrl);
router.delete('/:id', authRequired, rbac('provider'), deleteCtrl);

export default router;
