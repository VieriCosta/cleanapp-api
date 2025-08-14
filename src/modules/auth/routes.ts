import { Router } from 'express';
import { loginCtrl, refreshCtrl, registerCtrl, logoutCtrl } from './controller';

const router = Router();

router.post('/register', registerCtrl);
router.post('/login', loginCtrl);
router.post('/refresh', refreshCtrl);
router.post('/logout', logoutCtrl);

export default router;
