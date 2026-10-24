import { Router } from 'express';
import { getGIS, saveGIS, deleteGIS } from '../controllers/gis.controller';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

// /api/projects/:projectId/gis
router.get('/', getGIS);
router.post('/', saveGIS);
router.put('/', saveGIS);  // upsert
router.delete('/', deleteGIS);

export default router;
