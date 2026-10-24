import { z } from 'zod';

export const saveGISSchema = z.object({
  centerLatitude: z.number().min(-90).max(90).optional().nullable(),
  centerLongitude: z.number().min(-180).max(180).optional().nullable(),
  boundaryGeoJSON: z.string().optional().nullable(),
  calculatedAreaHa: z.number().optional().nullable(),
  perimeterKm: z.number().optional().nullable(),
  coordinateSystem: z.string().optional(),
  mapZoom: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});
