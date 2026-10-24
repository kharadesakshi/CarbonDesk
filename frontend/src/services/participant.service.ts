import api from './api';
import { Participant, ApiResponse, PaginatedResponse } from '../types';

export interface CreateParticipantPayload {
  fullName: string;
  participantCode?: string;
  participantType: string;
  email?: string;
  phone?: string;
  village?: string;
  district?: string;
  stateRegion?: string;
  country?: string;
  address?: string;
  plotId?: string;
  plotAreaHa?: number;
  plotDescription?: string;
  status?: 'active' | 'inactive' | 'pending';
  enrollmentDate?: string;
  consentGiven?: boolean;
  consentDate?: string;
  additionalNotes?: string;
}

export async function listParticipants(
  projectId: string,
  search?: string,
  status?: string,
  page: number = 1,
  limit: number = 50
) {
  const response = await api.get<PaginatedResponse<Participant>>(`/projects/${projectId}/participants`, {
    params: { search, status, page, limit },
  });
  return response.data;
}

export async function getParticipant(id: string) {
  const response = await api.get<ApiResponse<{ data: Participant }>>(`/participants/${id}`);
  return response.data.data;
}

export async function createParticipant(projectId: string, payload: CreateParticipantPayload) {
  const response = await api.post<ApiResponse<{ data: Participant }>>(`/projects/${projectId}/participants`, payload);
  return response.data.data;
}

export async function updateParticipant(id: string, payload: Partial<CreateParticipantPayload>) {
  const response = await api.put<ApiResponse<{ data: Participant }>>(`/participants/${id}`, payload);
  return response.data.data;
}

export async function deleteParticipant(id: string) {
  await api.delete(`/participants/${id}`);
}
