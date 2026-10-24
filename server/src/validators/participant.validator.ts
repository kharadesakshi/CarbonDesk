import { z } from 'zod';

export const createParticipantSchema = z.object({
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
  plotAreaHa: z.number().positive().optional().nullable(),
  plotDescription: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  enrollmentDate: z.string().optional().nullable(),
  consentGiven: z.boolean().optional(),
  consentDate: z.string().optional().nullable(),
  additionalNotes: z.string().optional(),
});

export const updateParticipantSchema = createParticipantSchema.partial();
