import { Router } from 'express';
import {
  listMRVCycles,
  createMRVCycle,
  getMRVCycle,
  updateMRVCycle,
  deleteMRVCycle,
  listMeasurementTypes,
  seedMeasurementTypes,
  createMeasurementType,
  getMeasurementType,
  listMeasurements,
  createMeasurement,
  getMeasurement,
  updateMeasurement,
  deleteMeasurement,
  submitMeasurement,
  validateMeasurement,
  generateReport,
  getReport,
  submitReport,
  recordVerification,
  getMRVDashboardStats,
  transitionMRVCycle,
  attachEvidence,
  listEvidence,
  deleteEvidence,
  listAuditLogs,
} from '../controllers/mrv.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Seed endpoint (public, optional parameter for initial setup)
router.post('/measurement-types/seed', seedMeasurementTypes);

// Protect all other routes
router.use(authenticate);

// ─── MRV Dashboard ────────────────────────────────────────────────────────────
router.get('/mrv/dashboard/stats', getMRVDashboardStats);
router.get('/mrv/audit', listAuditLogs);

// ─── MRV Cycles ───────────────────────────────────────────────────────────────
router.get('/projects/:projectId/mrv', listMRVCycles);
router.post('/projects/:projectId/mrv', createMRVCycle);
router.get('/mrv/:mrvCycleId', getMRVCycle);
router.put('/mrv/:mrvCycleId', updateMRVCycle);
router.delete('/mrv/:mrvCycleId', deleteMRVCycle);
router.post('/mrv/:mrvCycleId/transition', transitionMRVCycle);

// ─── Evidence & Document Vault Integration ────────────────────────────────────
router.get('/mrv/:mrvCycleId/evidence', listEvidence);
router.post('/mrv/:mrvCycleId/evidence', attachEvidence);
router.delete('/mrv/evidence/:evidenceId', deleteEvidence);

// ─── Measurement Types ────────────────────────────────────────────────────────
router.get('/measurement-types', listMeasurementTypes);
router.post('/measurement-types', createMeasurementType);
router.get('/measurement-types/:typeId', getMeasurementType);

// ─── Measurements ─────────────────────────────────────────────────────────────
router.get('/mrv/:mrvCycleId/measurements', listMeasurements);
router.post('/projects/:projectId/mrv/:mrvCycleId/measurements', createMeasurement);
router.get('/measurements/:measurementId', getMeasurement);
router.put('/measurements/:measurementId', updateMeasurement);
router.delete('/measurements/:measurementId', deleteMeasurement);
router.post('/measurements/:measurementId/submit', submitMeasurement);
router.post('/measurements/:measurementId/validate', validateMeasurement);

// ─── Reports ──────────────────────────────────────────────────────────────────
router.post('/mrv/:mrvCycleId/report/generate', generateReport);
router.get('/reports/:reportId', getReport);
router.post('/reports/:reportId/submit', submitReport);

// ─── Verification ────────────────────────────────────────────────────────────
router.post('/reports/:reportId/verify', recordVerification);

export default router;
