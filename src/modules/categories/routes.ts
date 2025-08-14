import { Router } from 'express';
import { authRequired, rbac } from '../../middlewares/auth';
import {
  listCtrl, listAllCtrl, detailCtrl, createCtrl, updateCtrl, deleteCtrl
} from './controller';

const router = Router();

// público
router.get('/', listCtrl);
router.get('/:id', detailCtrl);

// admin-only
router.get('/admin/all', authRequired, rbac('admin'), listAllCtrl);
router.post('/',        authRequired, rbac('admin'), createCtrl);
router.put('/:id',      authRequired, rbac('admin'), updateCtrl);
router.delete('/:id',   authRequired, rbac('admin'), deleteCtrl);

export default router;
