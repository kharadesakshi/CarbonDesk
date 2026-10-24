import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(2, 'Project name is required').max(255),
  projectCode: z.string().optional(),
  description: z.string().optional(),
  projectType: z.string().min(1, 'Project type is required'),
  category: z.string().optional(),
  methodology: z.string().optional(),
  country: z.string().optional(),
  stateRegion: z.string().optional(),
  district: z.string().optional(),
  cityVillage: z.string().optional(),
  addressDescription: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional().or(z.literal('')),
  longitude: z.coerce.number().min(-180).max(180).optional().or(z.literal('')),
  startDate: z.string().optional(),
  expectedDurationYears: z.coerce.number().int().positive().optional().or(z.literal('')),
  projectAreaHa: z.coerce.number().positive().optional().or(z.literal('')),
  estimatedAnnualCO2Tonnes: z.coerce.number().positive().optional().or(z.literal('')),
  expectedCarbonCredits: z.coerce.number().positive().optional().or(z.literal('')),
  targetCertification: z.string().optional(),
  monitoringFrequency: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
