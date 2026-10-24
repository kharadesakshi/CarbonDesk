import api from './api';
import {
  CreateMRVCycleInput,
  UpdateMRVCycleInput,
  CreateMeasurementInput,
  UpdateMeasurementInput,
  SubmitMeasurementInput,
  ValidateMeasurementInput,
  RecordVerificationInput,
  AttachEvidenceInput,
  TransitionCycleInput,
} from '../schemas/mrv.schema';

// ─── MRV Cycles ───────────────────────────────────────────────────────────────

export async function listMRVCycles(
  projectId: string,
  status?: string,
  page: number = 1,
  limit: number = 50
): Promise<{ data: any[]; pagination: any }> {
  const params: any = { page, limit };
  if (status) params.status = status;

  const response = await api.get<{ data: any[]; pagination: any }>(
    `/projects/${projectId}/mrv`,
    { params }
  );
  return response.data;
}

export async function createMRVCycle(
  projectId: string,
  payload: CreateMRVCycleInput
): Promise<any> {
  const response = await api.post<{ data: any }>(`/projects/${projectId}/mrv`, payload);
  return response.data.data;
}

export async function getMRVCycle(mrvCycleId: string): Promise<any> {
  const response = await api.get<{ data: any }>(`/mrv/${mrvCycleId}`);
  return response.data.data;
}

export async function updateMRVCycle(
  mrvCycleId: string,
  payload: UpdateMRVCycleInput
): Promise<any> {
  const response = await api.put<{ data: any }>(`/mrv/${mrvCycleId}`, payload);
  return response.data.data;
}

export async function deleteMRVCycle(mrvCycleId: string): Promise<void> {
  await api.delete(`/mrv/${mrvCycleId}`);
}

// ─── Measurement Types ────────────────────────────────────────────────────────

export async function listMeasurementTypes(
  category?: string,
  page: number = 1,
  limit: number = 100
): Promise<{ data: any[]; pagination: any }> {
  const params: any = { page, limit };
  if (category) params.category = category;

  const response = await api.get<{ data: any[]; pagination: any }>(
    '/measurement-types',
    { params }
  );
  return response.data;
}

export async function getMeasurementType(typeId: string): Promise<any> {
  const response = await api.get<{ data: any }>(`/measurement-types/${typeId}`);
  return response.data.data;
}

// ─── Measurements ─────────────────────────────────────────────────────────────

export async function listMeasurements(
  mrvCycleId: string,
  status?: string,
  page: number = 1,
  limit: number = 100
): Promise<{ data: any[]; pagination: any }> {
  const params: any = { page, limit };
  if (status) params.status = status;

  const response = await api.get<{ data: any[]; pagination: any }>(
    `/mrv/${mrvCycleId}/measurements`,
    { params }
  );
  return response.data;
}

export async function createMeasurement(
  projectId: string,
  mrvCycleId: string,
  payload: CreateMeasurementInput
): Promise<any> {
  const response = await api.post<{ data: any }>(
    `/projects/${projectId}/mrv/${mrvCycleId}/measurements`,
    payload
  );
  return response.data.data;
}

export async function getMeasurement(measurementId: string): Promise<any> {
  const response = await api.get<{ data: any }>(`/measurements/${measurementId}`);
  return response.data.data;
}

export async function updateMeasurement(
  measurementId: string,
  payload: UpdateMeasurementInput
): Promise<any> {
  const response = await api.put<{ data: any }>(`/measurements/${measurementId}`, payload);
  return response.data.data;
}

export async function deleteMeasurement(measurementId: string): Promise<void> {
  await api.delete(`/measurements/${measurementId}`);
}

export async function submitMeasurement(
  measurementId: string,
  payload?: SubmitMeasurementInput
): Promise<any> {
  const response = await api.post<{ data: any }>(
    `/measurements/${measurementId}/submit`,
    payload || {}
  );
  return response.data.data;
}

export async function validateMeasurement(
  measurementId: string,
  payload: ValidateMeasurementInput
): Promise<any> {
  const response = await api.post<{ data: any }>(
    `/measurements/${measurementId}/validate`,
    payload
  );
  return response.data.data;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function generateReport(mrvCycleId: string): Promise<any> {
  const response = await api.post<{ data: any }>(
    `/mrv/${mrvCycleId}/report/generate`,
    {}
  );
  return response.data.data;
}

export async function getReport(reportId: string): Promise<any> {
  const response = await api.get<{ data: any }>(`/reports/${reportId}`);
  return response.data.data;
}

export async function submitReport(reportId: string): Promise<any> {
  const response = await api.post<{ data: any }>(`/reports/${reportId}/submit`, {});
  return response.data.data;
}

// ─── Verification ─────────────────────────────────────────────────────────────

export async function recordVerification(
  reportId: string,
  payload: RecordVerificationInput
): Promise<any> {
  const response = await api.post<{ data: any }>(
    `/reports/${reportId}/verify`,
    payload
  );
  return response.data.data;
}

// ─── MRV Dashboard & Audit ───────────────────────────────────────────────────

export async function getMRVDashboardStats(projectId?: string): Promise<{
  summary: {
    totalCycles: number;
    draftCycles: number;
    dataCollectionCycles: number;
    underReviewCycles: number;
    verifiedCycles: number;
    rejectedCycles: number;
    totalMeasurements: number;
    validMeasurements: number;
    totalEvidenceCount: number;
    totalReports: number;
  };
  cycles: any[];
  projectSummaries: any[];
  attentionItems: any[];
  recentActivity: any[];
}> {
  const params: any = {};
  if (projectId) params.projectId = projectId;
  const response = await api.get<{ data: any }>('/mrv/dashboard/stats', { params });
  return response.data.data;
}

export async function listMRVAuditLogs(
  projectId?: string,
  mrvCycleId?: string,
  limit: number = 50
): Promise<any[]> {
  const params: any = { limit };
  if (projectId) params.projectId = projectId;
  if (mrvCycleId) params.mrvCycleId = mrvCycleId;
  const response = await api.get<{ data: any[] }>('/mrv/audit', { params });
  return response.data.data || [];
}

// ─── Status Transitions ───────────────────────────────────────────────────────

export async function transitionMRVCycle(
  mrvCycleId: string,
  payload: { targetStatus: string; comment?: string }
): Promise<any> {
  const response = await api.post<{ data: any }>(`/mrv/${mrvCycleId}/transition`, payload);
  return response.data.data;
}

// ─── Evidence & Documents ─────────────────────────────────────────────────────

export async function attachEvidence(
  mrvCycleId: string,
  payload: {
    documentId: string;
    measurementId?: string;
    evidenceType?: string;
    description?: string;
  }
): Promise<any> {
  const response = await api.post<{ data: any }>(`/mrv/${mrvCycleId}/evidence`, payload);
  return response.data.data;
}

export async function listEvidence(
  mrvCycleId: string,
  measurementId?: string
): Promise<any[]> {
  const params: any = {};
  if (measurementId) params.measurementId = measurementId;
  const response = await api.get<{ data: any[] }>(`/mrv/${mrvCycleId}/evidence`, { params });
  return response.data.data || [];
}

export async function deleteEvidence(evidenceId: string): Promise<void> {
  await api.delete(`/mrv/evidence/${evidenceId}`);
}
