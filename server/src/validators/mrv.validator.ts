import { z } from 'zod';

// ─── MRV Cycle Validators ─────────────────────────────────────────────────────

export const createMRVCycleSchema = z.object({
  cycleName: z.string().min(1, 'Cycle name is required').max(255),
  cycleCode: z.string().min(1, 'Cycle code is required').max(100),
  monitoringStartDate: z.string().date('Invalid start date format'),
  monitoringEndDate: z.string().date('Invalid end date format'),
  description: z.string().max(5000).optional().nullable(),
}).refine(
  (data) => new Date(data.monitoringStartDate) < new Date(data.monitoringEndDate),
  {
    message: 'End date must be after start date',
    path: ['monitoringEndDate'],
  }
);

export const updateMRVCycleSchema = z.object({
  cycleName: z.string().min(1).max(255).optional(),
  cycleCode: z.string().min(1).max(100).optional(),
  monitoringStartDate: z.string().date().optional(),
  monitoringEndDate: z.string().date().optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum([
    'draft',
    'data_collection',
    'data_submitted',
    'validation',
    'needs_correction',
    'validated',
    'report_generated',
    'submitted_for_verification',
    'under_verification',
    'verified',
    'rejected',
  ]).optional(),
}).refine(
  (data) => {
    if (data.monitoringStartDate && data.monitoringEndDate) {
      return new Date(data.monitoringStartDate) < new Date(data.monitoringEndDate);
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['monitoringEndDate'],
  }
);

// ─── Measurement Type Validators ──────────────────────────────────────────────

export const createMeasurementTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  unit: z.string().min(1, 'Unit is required').max(100),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
});

// ─── Measurement Validators ───────────────────────────────────────────────────

export const createMeasurementSchema = z.object({
  measurementTypeId: z.string().uuid('Invalid measurement type ID'),
  value: z.number().min(-Infinity, 'Value is required').finite('Value must be a finite number'),
  unit: z.string().min(1, 'Unit is required').max(100),
  measurementDate: z.string().date('Invalid measurement date format'),
  participantId: z.string().uuid().optional().nullable(),
  source: z.enum(['manual', 'field_survey', 'document', 'gis', 'satellite', 'iot', 'import', 'other']).optional(),
  dataCategory: z.enum(['baseline', 'project', 'monitoring']).optional(),
  locationCoordinates: z.string().max(255).optional().nullable(),
  plotReference: z.string().max(100).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  documentId: z.string().uuid().optional().nullable(),
  evidenceType: z.string().max(100).optional().nullable(),
});

export const updateMeasurementSchema = z.object({
  value: z.number().finite('Value must be a finite number').optional(),
  unit: z.string().min(1).max(100).optional(),
  measurementDate: z.string().date().optional(),
  participantId: z.string().uuid().optional().nullable(),
  source: z.enum(['manual', 'field_survey', 'document', 'gis', 'satellite', 'iot', 'import', 'other']).optional(),
  dataCategory: z.enum(['baseline', 'project', 'monitoring']).optional(),
  locationCoordinates: z.string().max(255).optional().nullable(),
  plotReference: z.string().max(100).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  status: z.enum(['draft', 'submitted', 'valid', 'invalid', 'needs_correction']).optional(),
  validationNotes: z.string().max(10000).optional().nullable(),
});

export const attachEvidenceSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
  measurementId: z.string().uuid().optional().nullable(),
  evidenceType: z.string().min(1, 'Evidence type is required').max(100),
  description: z.string().max(5000).optional().nullable(),
});

export const transitionCycleSchema = z.object({
  targetStatus: z.enum([
    'draft',
    'data_collection',
    'data_submitted',
    'validation',
    'needs_correction',
    'validated',
    'report_generated',
    'submitted_for_verification',
    'under_verification',
    'verified',
    'rejected',
  ]),
  notes: z.string().max(5000).optional().nullable(),
});

export const submitMeasurementSchema = z.object({
  notes: z.string().max(10000).optional().nullable(),
});

export const validateMeasurementSchema = z.object({
  status: z.enum(['valid', 'invalid', 'needs_correction']),
  validationNotes: z.string().max(10000).optional().nullable(),
});

// ─── MRV Report Validators ────────────────────────────────────────────────────

export const generateMRVReportSchema = z.object({
  // No required fields - generates from cycle data
});

export const submitMRVReportSchema = z.object({
  // Optional notes for submission
});

// ─── Verification Validators ──────────────────────────────────────────────────

export const recordVerificationSchema = z.object({
  status: z.enum(['verified', 'rejected', 'requires_changes']),
  comments: z.string().max(10000).optional().nullable(),
  findings: z.string().max(10000).optional().nullable(),
});

// ─── Batch Operations ─────────────────────────────────────────────────────────

export const submitMeasurementsSchema = z.object({
  measurementIds: z.array(z.string().uuid('Invalid measurement ID')).min(1, 'At least one measurement required'),
});

export const validateMeasurementsSchema = z.object({
  measurementIds: z.array(z.string().uuid()).min(1),
  status: z.enum(['valid', 'invalid', 'needs_correction']),
  validationNotes: z.string().max(10000).optional().nullable(),
});

// Export types for TypeScript
export type CreateMRVCycleInput = z.infer<typeof createMRVCycleSchema>;
export type UpdateMRVCycleInput = z.infer<typeof updateMRVCycleSchema>;
export type CreateMeasurementTypeInput = z.infer<typeof createMeasurementTypeSchema>;
export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;
export type UpdateMeasurementInput = z.infer<typeof updateMeasurementSchema>;
export type SubmitMeasurementInput = z.infer<typeof submitMeasurementSchema>;
export type ValidateMeasurementInput = z.infer<typeof validateMeasurementSchema>;
export type RecordVerificationInput = z.infer<typeof recordVerificationSchema>;
export type SubmitMeasurementsInput = z.infer<typeof submitMeasurementsSchema>;
export type ValidateMeasurementsInput = z.infer<typeof validateMeasurementsSchema>;
