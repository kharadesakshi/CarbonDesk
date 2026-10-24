import api from './api';
import { Document, ApiResponse } from '../types';

export async function listProjectDocuments(projectId: string, participantId?: string, documentType?: string) {
  const response = await api.get<ApiResponse<{ data: Document[] }>>(`/documents/project/${projectId}`, {
    params: { participantId, documentType },
  });
  return response.data.data || [];
}

export async function listParticipantDocuments(participantId: string) {
  const response = await api.get<ApiResponse<{ data: Document[] }>>(`/documents/participant/${participantId}`);
  return response.data.data || [];
}

export async function uploadParticipantDocument(participantId: string, file: File, documentName: string, documentType: string, notes?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentName', documentName);
  formData.append('documentType', documentType);
  if (notes) formData.append('notes', notes);

  const response = await api.post<ApiResponse<{ data: Document }>>(`/documents/participant/${participantId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

export async function uploadProjectDocument(projectId: string, file: File, documentName: string, documentType: string, notes?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentName', documentName);
  formData.append('documentType', documentType);
  if (notes) formData.append('notes', notes);

  const response = await api.post<ApiResponse<{ data: Document }>>(`/documents/project/${projectId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

export async function getDocument(id: string) {
  const response = await api.get<ApiResponse<{ data: Document }>>(`/documents/${id}`);
  return response.data.data;
}

export async function deleteDocument(id: string) {
  await api.delete(`/documents/${id}`);
}

export async function downloadDocument(id: string, fallbackFileName?: string) {
  try {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream',
    });
    const contentDisposition = response.headers['content-disposition'];
    let fileName = fallbackFileName || 'document';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        fileName = match[1];
      }
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    const token = localStorage.getItem('token');
    const url = token
      ? `/api/documents/${id}/download?token=${encodeURIComponent(token)}`
      : `/api/documents/${id}/download`;
    window.open(url, '_blank');
  }
}

