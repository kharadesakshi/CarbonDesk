import { Router } from 'express';
import {
  listParticipants,
  createParticipant,
  getParticipant,
  updateParticipant,
  deleteParticipant,
} from '../controllers/participant.controller';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

// Project-scoped: /api/projects/:projectId/participants
router.get('/', listParticipants);
router.post('/', createParticipant);

// Individual participant: /api/participants/:id (mounted separately)
router.get('/:id', getParticipant);
router.put('/:id', updateParticipant);
router.delete('/:id', deleteParticipant);

export default router;
