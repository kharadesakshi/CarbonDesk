import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Trash2,
  Upload,
  FileText,
  User,
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  RefreshCw,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { AppShell } from '../components/ui';
import { getProject } from '../services/project.service';
import { getParticipant } from '../services/participant.service';
import {
  listParticipantDocuments,
  uploadParticipantDocument,
  deleteDocument,
  downloadDocument,
} from '../services/document.service';
import { Project, Participant, Document } from '../types';

export function ParticipantDocumentsView() {
  const { projectId, participantId } = useParams<{ projectId: string; participantId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!participantId) return;
    setLoading(true);
    setError(null);
    try {
      const [participantData, docsData] = await Promise.all([
        getParticipant(participantId),
        listParticipantDocuments(participantId),
      ]);
      setParticipant(participantData);
      setDocuments(docsData || []);

      const projId = projectId || participantData.projectId;
      if (projId) {
        const projData = await getProject(projId).catch(() => null);
        if (projData) setProject(projData);
      }
    } catch (err: any) {
      console.error('Failed to load participant documents:', err);
      setError(err?.response?.data?.error || 'Failed to load participant details or documents.');
    } finally {
      setLoading(false);
    }
  }, [participantId, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!participantId) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('file') as File;
    const documentName = formData.get('documentName') as string;
    const documentType = formData.get('documentType') as string;
    const notes = (formData.get('notes') as string) || undefined;

    if (!file || !file.name) {
      alert('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const doc = await uploadParticipantDocument(participantId, file, documentName, documentType, notes);
      setDocuments((prev) => [doc, ...prev]);
      setSuccess(`Document "${documentName || file.name}" uploaded successfully.`);
      form.reset();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err?.response?.data?.error || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete document "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      console.error('Failed to delete document:', err);
      alert(err?.response?.data?.error || 'Failed to delete document.');
    }
  };

  const parentProjectId = projectId || participant?.projectId;

  if (loading) {
    return (
      <AppShell>
        <div className="py-24 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-forest" />
          <p className="text-sm font-medium text-stone-600">Loading participant documents...</p>
        </div>
      </AppShell>
    );
  }

  if (!participant) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-xs">
          <AlertCircle size={36} className="mx-auto text-amber-500 mb-3" />
          <h2 className="text-2xl font-bold text-forest-deep">Participant Not Found</h2>
          <p className="mt-2 text-sm text-stone-600">
            The requested participant was not found or access is denied.
          </p>
          <div className="mt-6">
            <Link
              to={parentProjectId ? `/documents/projects/${parentProjectId}` : '/documents'}
              className="rounded-lg bg-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-forest-deep"
            >
              Back to Project Documents
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Return Link */}
      <div className="mb-4">
        <Link
          to={parentProjectId ? `/documents/projects/${parentProjectId}` : '/documents'}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-forest transition hover:text-emerald-700 hover:underline"
        >
          <ArrowLeft size={16} />
          <span>Back to Project Documents ({project?.name || 'Project'})</span>
        </Link>
      </div>

      {/* Participant Header Card */}
      <div className="mb-6 rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-forest text-white shadow-sm font-bold text-xl">
              <User size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-700">
                  {participant.participantType}
                </span>
                {participant.participantCode && (
                  <span className="text-xs font-mono text-stone-500">
                    {participant.participantCode}
                  </span>
                )}
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-success border border-emerald-200">
                  {participant.status || 'Active'}
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-black text-forest-deep tracking-tight">
                {participant.fullName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-stone-600">
                {participant.village && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-stone-400" />
                    <span>Village: {participant.village}</span>
                  </span>
                )}
                {participant.plotId && (
                  <span>
                    Plot: <strong>{participant.plotId}</strong> ({participant.plotAreaHa ?? '—'} Ha)
                  </span>
                )}
                {participant.consentGiven && (
                  <span className="flex items-center gap-1 text-success font-semibold">
                    <ShieldCheck size={13} />
                    <span>Consent Provided</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="rounded-lg border border-stone-300 p-2 text-stone-600 hover:bg-stone-50"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Participant Document Form */}
      <section className="mb-6 rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-forest-deep flex items-center gap-2 mb-4">
          <Upload size={18} className="text-forest" />
          <span>Upload Participant Document</span>
        </h2>

        <form onSubmit={handleUpload}>
          <div className="grid gap-4 md:grid-cols-4 items-end">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Document Name *
              </label>
              <input
                type="text"
                name="documentName"
                required
                placeholder="e.g., National ID / Land Deed"
                className="w-full rounded-lg border border-stone-300 p-2.5 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Document Type *
              </label>
              <select
                name="documentType"
                required
                defaultValue=""
                className="w-full rounded-lg border border-stone-300 bg-white p-2.5 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
              >
                <option value="" disabled>Select type...</option>
                <option value="Identity Document">Identity Document</option>
                <option value="Land Ownership Document">Land Ownership Document</option>
                <option value="Consent Form">Consent Form</option>
                <option value="Agreement">Agreement / Contract</option>
                <option value="Registration Document">Registration Document</option>
                <option value="Photo Evidence">Photo Evidence</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Select File *
              </label>
              <input
                type="file"
                name="file"
                required
                className="w-full text-xs text-stone-600 file:mr-2 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-forest hover:file:bg-stone-200"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={uploading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-forest-deep disabled:opacity-50"
              >
                <Upload size={16} />
                <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Participant Documents List */}
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-forest-deep">Participant Documents</h2>
            <p className="text-xs text-stone-500">
              Verified identity, land tenure, and agreement documentation for {participant.fullName}
            </p>
          </div>
          <span className="text-xs font-semibold text-stone-600">
            {documents.length} document{documents.length === 1 ? '' : 's'}
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/50 p-10 text-center">
            <FolderOpen size={36} className="mx-auto text-stone-400 mb-2" />
            <h3 className="text-base font-bold text-forest-deep">No documents for this participant</h3>
            <p className="mt-1 text-xs text-stone-600">
              Upload consent forms, national ID copies, or land tenure certificates above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-stone-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs font-bold uppercase tracking-wider text-stone-600 border-b border-stone-200">
                <tr>
                  <th className="p-3.5">Document Name</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">File Name</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">Upload Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {documents.map((doc) => {
                  const sizeKb = Math.round(doc.fileSizeBytes / 1024);
                  const sizeText = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

                  return (
                    <tr key={doc.id} className="transition hover:bg-stone-50/80">
                      <td className="p-3.5 font-bold text-forest">
                        {doc.documentName}
                      </td>
                      <td className="p-3.5 text-xs text-stone-700">
                        {doc.documentType}
                      </td>
                      <td className="p-3.5 text-xs font-mono text-stone-600 truncate max-w-[180px]" title={doc.originalFileName}>
                        {doc.originalFileName}
                      </td>
                      <td className="p-3.5 text-xs text-stone-600 whitespace-nowrap">
                        {sizeText}
                      </td>
                      <td className="p-3.5 text-xs text-stone-500 whitespace-nowrap">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-success border border-emerald-200">
                          {doc.verificationStatus || 'Verified'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => downloadDocument(doc.id, doc.originalFileName)}
                            className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-forest hover:text-white"
                            title="Download document"
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id, doc.documentName)}
                            className="rounded-md p-1.5 text-stone-400 hover:bg-red-50 hover:text-danger transition"
                            title="Delete document"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
