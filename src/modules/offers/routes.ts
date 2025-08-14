import { Router } from 'express';
import { listCtrl } from './controller';

const router = Router();
router.get('/', listCtrl);

export default router;
