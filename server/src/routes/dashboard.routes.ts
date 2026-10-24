import { Router } from 'express';
import { getDashboardStats, getCacheStatus, clearCache } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Dashboard stats
router.get('/stats', getDashboardStats);

// Cache management (admin only in production)
router.get('/cache', getCacheStatus);
router.delete('/cache', clearCache);

export default router;
