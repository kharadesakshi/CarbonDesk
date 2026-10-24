import { z } from 'zod';

export const participantSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(255),
  participantCode: z.string().optional(),
  participantType: z.string().min(1, 'Participant type is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  village: z.string().optional(),
  district: z.string().optional(),
  stateRegion: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  plotId: z.string().optional(),
  plotAreaHa: z.coerce.number().positive().optional().or(z.literal('')),
  plotDescription: z.string().optional(),
  consentGiven: z.boolean().optional(),
  additionalNotes: z.string().optional(),
});

export type ParticipantFormData = z.infer<typeof participantSchema>;
