import { Router } from 'express';
import { liveness, readiness } from '../observability/health';

import authRoutes from '../modules/auth/routes';
import userRoutes from '../modules/users/routes';
import categoriesRoutes from '../modules/categories/routes';
import offersRoutes from '../modules/offers/routes';   

const router = Router();

router.get('/health/live', liveness);
router.get('/health/ready', readiness);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoriesRoutes);
router.use('/offers', offersRoutes);  

export default router;
