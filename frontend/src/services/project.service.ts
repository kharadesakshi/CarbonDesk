import api from './api';
import { Project, ApiResponse, PaginatedResponse, DashboardStats } from '../types';

export interface CreateProjectPayload {
  name: string;
  projectCode?: string;
  description?: string;
  projectType: string;
  category?: string;
  methodology?: string;
  status?: 'draft' | 'active' | 'under_review' | 'validated' | 'archived';
  country?: string;
  stateRegion?: string;
  district?: string;
  cityVillage?: string;
  addressDescription?: string;
  latitude?: number;
  longitude?: number;
  startDate?: string;
  expectedDurationYears?: number;
  projectAreaHa?: number;
  estimatedAnnualCO2Tonnes?: number;
  expectedCarbonCredits?: number;
  targetCertification?: string;
  monitoringFrequency?: string;
  additionalNotes?: string;
}

export async function listProjects(
  search?: string,
  status?: string,
  type?: string,
  page: number = 1,
  limit: number = 20,
  sortBy?: string,
  sortOrder?: 'ASC' | 'DESC'
) {
  const response = await api.get<PaginatedResponse<Project>>('/projects', {
    params: { search, status, type, page, limit, sortBy, sortOrder },
  });
  return response.data;
}

export async function getProject(id: string) {
  const response = await api.get<{ data: Project }>(`/projects/${id}`);
  return response.data.data;
}

export async function createProject(payload: CreateProjectPayload) {
  const response = await api.post<ApiResponse<{ data: Project }>>('/projects', payload);
  return response.data.data;
}

export async function updateProject(id: string, payload: Partial<CreateProjectPayload>) {
  const response = await api.put<ApiResponse<{ data: Project }>>(`/projects/${id}`, payload);
  return response.data.data;
}

export async function deleteProject(id: string) {
  await api.delete(`/projects/${id}`);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<ApiResponse<{ data: any }>>('/dashboard/stats');
  const d = (response.data as any).data || response.data;
  if (d && d.projects) {
    return {
      totalProjects: d.projects.total ?? 0,
      activeProjects: d.projects.active ?? 0,
      draftProjects: d.projects.draft ?? 0,
      underReviewProjects: d.projects.underReview ?? 0,
      validatedProjects: d.projects.completed ?? 0,
      totalParticipants: d.participants?.total ?? 0,
      gisEnabledProjects: d.gis?.projectsWithBoundary ?? 0,
      totalDocuments: d.documents?.total ?? 0,
      raw: d,
    };
  }
  return d;
}

