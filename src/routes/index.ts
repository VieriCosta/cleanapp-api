import { Router } from 'express';
import authRoutes from '../modules/auth/routes';
import usersRoutes from '../modules/users/routes';
import categoriesRoutes from '../modules/categories/routes';
import offersRoutes from '../modules/offers/routes';
import addressesRoutes from '../modules/addresses/routes';
import jobsRoutes from '../modules/jobs/routes';
import conversationsRoutes from '../modules/conversations/routes';
import userPhotoRoutes from '../modules/users/photo.routes'; //
import { authRequired } from '../middlewares/auth';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/categories', categoriesRoutes);
router.use('/offers', offersRoutes);
router.use('/addresses', authRequired, addressesRoutes);
router.use('/jobs', jobsRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/users', userPhotoRoutes);

export default router;
