import { Router } from 'express';
import {
  listProjectDocuments,
  listParticipantDocuments,
  uploadDocument,
  uploadProjectDocument,
  getDocument,
  downloadDocument,
  serveLocalFile,
  deleteDocument,
} from '../controllers/document.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { fileValidator, checkFileSizeLimit } from '../middleware/fileValidator';

const router = Router({ mergeParams: true });

router.use(authenticate);

// Project-level documents: /api/projects/:projectId/documents
router.get('/project/:projectId', listProjectDocuments);
router.post(
  '/project/:projectId',
  checkFileSizeLimit,
  upload.single('file'),
  fileValidator('file'),
  uploadProjectDocument
);

// Participant documents: /api/participants/:participantId/documents
router.get('/participant/:participantId', listParticipantDocuments);
router.post(
  '/participant/:participantId',
  checkFileSizeLimit,
  upload.single('file'),
  fileValidator('file'),
  uploadDocument
);

// Individual document
router.get('/:id', getDocument);
router.get('/:id/download', downloadDocument);
router.delete('/:id', deleteDocument);

// Serve local files (auth-protected)
router.get('/file/*', serveLocalFile);

export default router;
