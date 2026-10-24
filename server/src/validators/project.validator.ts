import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name is required').max(255),
  projectCode: z.string().optional(),
  description: z.string().optional(),
  projectType: z.string().min(1, 'Project type is required'),
  category: z.string().optional(),
  methodology: z.string().optional(),
  status: z.enum(['draft', 'active', 'under_review', 'validated', 'archived']).optional(),
  country: z.string().optional(),
  stateRegion: z.string().optional(),
  district: z.string().optional(),
  cityVillage: z.string().optional(),
  addressDescription: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  startDate: z.string().optional().nullable(),
  expectedDurationYears: z.number().int().positive().optional().nullable(),
  projectAreaHa: z.number().positive().optional().nullable(),
  estimatedAnnualCO2Tonnes: z.number().positive().optional().nullable(),
  expectedCarbonCredits: z.number().positive().optional().nullable(),
  targetCertification: z.string().optional(),
  monitoringFrequency: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();
