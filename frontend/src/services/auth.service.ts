import api from './api';
import { CarbonDeveloper, ApiResponse } from '../types';

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  organizationName?: string;
  organizationType?: string;
  registrationNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function register(payload: RegisterPayload) {
  const response = await api.post<ApiResponse<{ token: string; developer: CarbonDeveloper }>>('/auth/register', payload);
  return response.data;
}

export async function login(payload: LoginPayload) {
  const response = await api.post<ApiResponse<{ token: string; developer: CarbonDeveloper }>>('/auth/login', payload);
  return response.data;
}

export async function getMe() {
  const response = await api.get<ApiResponse<{ developer: CarbonDeveloper }>>('/auth/me');
  return response.data;
}

export async function updateProfile(payload: Partial<CarbonDeveloper>) {
  const response = await api.put<ApiResponse<{ developer: CarbonDeveloper }>>('/auth/me', payload);
  return response.data;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function changePassword(payload: ChangePasswordPayload) {
  const response = await api.post<ApiResponse<{ message: string }>>('/auth/change-password', payload);
  return response.data;
}

