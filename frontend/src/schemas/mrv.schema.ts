import { z } from 'zod';

// ─── MRV Cycle Schemas ────────────────────────────────────────────────────────

export const createMRVCycleSchema = z.object({
  cycleName: z.string().min(1, 'Cycle name is required').max(255),
  cycleCode: z.string().min(1, 'Cycle code is required').max(100),
  monitoringStartDate: z.string().min(1, 'Start date is required'),
  monitoringEndDate: z.string().min(1, 'End date is required'),
  description: z.string().max(5000).optional().or(z.literal('')),
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
  monitoringStartDate: z.string().optional(),
  monitoringEndDate: z.string().optional(),
  description: z.string().max(5000).optional().or(z.literal('')),
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
});

// ─── Measurement Schemas ──────────────────────────────────────────────────────

export const createMeasurementSchema = z.object({
  measurementTypeId: z.string().uuid('Invalid measurement type'),
  value: z.string().refine(
    (val) => !Number.isNaN(parseFloat(val)),
    'Value must be a number'
  ).transform((val) => parseFloat(val)),
  unit: z.string().min(1, 'Unit is required').max(100),
  measurementDate: z.string().min(1, 'Measurement date is required'),
  participantId: z.string().uuid().optional().or(z.literal('')),
  source: z.enum(['manual', 'field_survey', 'document', 'gis', 'satellite', 'iot', 'import', 'other']).optional(),
  dataCategory: z.enum(['baseline', 'project', 'monitoring']).optional(),
  locationCoordinates: z.string().max(255).optional().or(z.literal('')),
  plotReference: z.string().max(255).optional().or(z.literal('')),
  documentId: z.string().uuid().optional().or(z.literal('')),
  evidenceType: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(10000).optional().or(z.literal('')),
});

export const updateMeasurementSchema = z.object({
  value: z.string().refine(
    (val) => !Number.isNaN(parseFloat(val)),
    'Value must be a number'
  ).transform((val) => parseFloat(val)).optional(),
  unit: z.string().min(1).max(100).optional(),
  measurementDate: z.string().optional(),
  participantId: z.string().uuid().optional().or(z.literal('')),
  source: z.enum(['manual', 'field_survey', 'document', 'gis', 'satellite', 'iot', 'import', 'other']).optional(),
  dataCategory: z.enum(['baseline', 'project', 'monitoring']).optional(),
  locationCoordinates: z.string().max(255).optional().or(z.literal('')),
  plotReference: z.string().max(255).optional().or(z.literal('')),
  notes: z.string().max(10000).optional().or(z.literal('')),
  status: z.enum(['draft', 'submitted', 'valid', 'invalid', 'needs_correction']).optional(),
  validationNotes: z.string().max(10000).optional().or(z.literal('')),
});

export const submitMeasurementSchema = z.object({
  notes: z.string().max(10000).optional().or(z.literal('')),
});

export const validateMeasurementSchema = z.object({
  status: z.enum(['valid', 'invalid', 'needs_correction']),
  validationNotes: z.string().max(10000).optional().or(z.literal('')),
});

// ─── Evidence Schemas ─────────────────────────────────────────────────────────

export const attachEvidenceSchema = z.object({
  documentId: z.string().uuid('Valid document ID is required'),
  measurementId: z.string().uuid().optional().or(z.literal('')),
  evidenceType: z.enum([
    'field_observation',
    'photo',
    'satellite_imagery',
    'lab_report',
    'gis_survey',
    'monitoring_spreadsheet',
    'third_party_audit',
    'other',
  ]).default('field_observation'),
  description: z.string().max(1000).optional().or(z.literal('')),
});

// ─── Status Transition Schema ────────────────────────────────────────────────

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
  comment: z.string().max(2000).optional().or(z.literal('')),
});

// ─── Verification Schemas ────────────────────────────────────────────────────

export const recordVerificationSchema = z.object({
  status: z.enum(['verified', 'rejected', 'requires_changes']),
  comments: z.string().max(10000).optional().or(z.literal('')),
  findings: z.string().max(10000).optional().or(z.literal('')),
});

// Export types
export type CreateMRVCycleInput = z.infer<typeof createMRVCycleSchema>;
export type UpdateMRVCycleInput = z.infer<typeof updateMRVCycleSchema>;
export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;
export type UpdateMeasurementInput = z.infer<typeof updateMeasurementSchema>;
export type SubmitMeasurementInput = z.infer<typeof submitMeasurementSchema>;
export type ValidateMeasurementInput = z.infer<typeof validateMeasurementSchema>;
export type AttachEvidenceInput = z.infer<typeof attachEvidenceSchema>;
export type TransitionCycleInput = z.infer<typeof transitionCycleSchema>;
export type RecordVerificationInput = z.infer<typeof recordVerificationSchema>;
