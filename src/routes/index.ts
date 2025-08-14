import { Router } from 'express';
import { liveness, readiness } from '../observability/health';

import authRoutes from '../modules/auth/routes';
import userRoutes from '../modules/users/routes';
import categoriesRoutes from '../modules/categories/routes';
import offersRoutes from '../modules/offers/routes';
import jobsRoutes from '../modules/jobs/routes';
import addressesRoutes from '../modules/addresses/routes';
import conversationsRoutes from '../modules/conversations/routes';

const router = Router();

router.get('/health/live', liveness);
router.get('/health/ready', readiness);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoriesRoutes);
router.use('/offers', offersRoutes); 
router.use('/jobs', jobsRoutes); 
router.use('/', addressesRoutes);
router.use('/conversations', conversationsRoutes);

export default router;
