import { Router } from 'express';
import { loginCtrl, meCtrl, registerCtrl } from './controller';
import { authRequired } from '../../middlewares/auth';

const router = Router();

router.post('/login', loginCtrl);
router.post('/register', registerCtrl);

router.get('/me', authRequired, meCtrl);

export default router;
