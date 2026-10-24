import api from './api';
import { ProjectGIS, ApiResponse } from '../types';

export interface SaveGISPayload {
  centerLatitude?: number | null;
  centerLongitude?: number | null;
  boundaryGeoJSON?: string | null;
  calculatedAreaHa?: number | null;
  perimeterKm?: number | null;
  coordinateSystem?: string;
  mapZoom?: number | null;
  notes?: string | null;
}

export async function getProjectGIS(projectId: string): Promise<ProjectGIS | null> {
  try {
    const response = await api.get<ApiResponse<ProjectGIS>>(`/projects/${projectId}/gis`);
    // The API returns { data: { data: ProjectGIS } } or { data: null }
    // We need to handle both cases
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching GIS data:', error);
    return null;
  }
}

export async function saveProjectGIS(projectId: string, payload: SaveGISPayload) {
  const response = await api.post<ApiResponse<ProjectGIS>>(`/projects/${projectId}/gis`, payload);
  return response.data.data;
}

export async function updateProjectGIS(projectId: string, payload: SaveGISPayload) {
  const response = await api.put<ApiResponse<ProjectGIS>>(`/projects/${projectId}/gis`, payload);
  return response.data.data;
}

export async function deleteProjectGIS(projectId: string) {
  await api.delete(`/projects/${projectId}/gis`);
}