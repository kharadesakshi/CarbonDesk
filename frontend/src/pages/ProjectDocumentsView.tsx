import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Trash2,
  Upload,
  FileText,
  Users,
  Search,
  Plus,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { AppShell, PageHeader, DataTable, StatusBadge } from '../components/ui';
import { getProject } from '../services/project.service';
import {
  listProjectDocuments,
  uploadProjectDocument,
  deleteDocument,
  downloadDocument,
} from '../services/document.service';
import { listParticipants } from '../services/participant.service';
import { Project, Document, Participant } from '../types';

export function ProjectDocumentsView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeTab, setActiveTab] = useState<'project_docs' | 'participants'>('project_docs');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [participantSearch, setParticipantSearch] = useState('');

  const loadAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const [projData, docsData, partsData] = await Promise.all([
        getProject(projectId),
        listProjectDocuments(projectId),
        listParticipants(projectId, undefined, undefined, 1, 100),
      ]);
      setProject(projData);
      setDocuments(docsData || []);
      setParticipants(partsData.data || []);
    } catch (err: any) {
      console.error('Failed to load project documents or details:', err);
      setError(err?.response?.data?.error || 'Failed to load project details and documents.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!projectId) return;

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
    setUploadSuccess(null);
    try {
      const doc = await uploadProjectDocument(projectId, file, documentName, documentType, notes);
      setDocuments((prev) => [doc, ...prev]);
      setUploadSuccess(`Document "${documentName || file.name}" uploaded successfully.`);
      form.reset();
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err?.response?.data?.error || 'Failed to upload document. Please check the file format and size.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
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

  const filteredParticipants = participants.filter((p) => {
    if (!participantSearch) return true;
    const q = participantSearch.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      (p.participantCode && p.participantCode.toLowerCase().includes(q)) ||
      (p.village && p.village.toLowerCase().includes(q)) ||
      (p.plotId && p.plotId.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <AppShell>
        <div className="py-24 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-forest" />
          <p className="text-sm font-medium text-stone-600">Loading project documents & participants...</p>
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-xs">
          <AlertCircle size={36} className="mx-auto text-amber-500 mb-3" />
          <h2 className="text-2xl font-bold text-forest-deep">Project Not Found</h2>
          <p className="mt-2 text-sm text-stone-600">
            The requested project was not found or you do not have permission to access it.
          </p>
          <div className="mt-6">
            <Link
              to="/documents"
              className="rounded-lg bg-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-forest-deep"
            >
              Back to Documents
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Return Navigation and Breadcrumbs */}
      <div className="mb-4">
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-forest transition hover:text-emerald-700 hover:underline"
        >
          <ArrowLeft size={16} />
          <span>Back to All Projects</span>
        </Link>
      </div>

      {/* Project Overview Banner */}
      <div className="mb-6 rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-success border border-emerald-200">
                {project.projectType}
              </span>
              <span className="text-xs font-mono text-stone-500">
                {project.projectCode || project.id}
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-forest-deep tracking-tight">
              {project.name}
            </h1>
            <p className="mt-1 text-xs text-stone-600">
              {[project.district || project.cityVillage, project.stateRegion, project.country].filter(Boolean).join(', ') || 'Global Project'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/projects/${project.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
            >
              <span>Project Details</span>
              <ExternalLink size={13} />
            </Link>
            <button
              onClick={loadAll}
              className="rounded-lg border border-stone-300 p-2 text-stone-600 hover:bg-stone-50"
              title="Refresh records"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex border-b border-stone-200 gap-6">
          <button
            onClick={() => setActiveTab('project_docs')}
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition ${
              activeTab === 'project_docs'
                ? 'border-forest text-forest'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileText size={18} />
            <span>Project-Level Documents</span>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700">
              {documents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('participants')}
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition ${
              activeTab === 'participants'
                ? 'border-forest text-forest'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Users size={18} />
            <span>Project Participants</span>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700">
              {participants.length}
            </span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {uploadSuccess && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-success animate-in fade-in">
          <CheckCircle2 size={18} />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-danger animate-in fade-in">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: Project-Level Documents */}
      {activeTab === 'project_docs' && (
        <div className="space-y-6">
          {/* Upload Form Box */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-forest-deep flex items-center gap-2 mb-4">
              <Upload size={18} className="text-forest" />
              <span>Upload Project Document</span>
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
                    placeholder="e.g., PDD Baseline Report 2026"
                    className="w-full rounded-lg border border-stone-300 p-2.5 text-sm text-ink placeholder-stone-400 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
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
                    <option value="" disabled>Select document type...</option>
                    <option value="Project Design Document">Project Design Document</option>
                    <option value="Baseline Report">Baseline Report</option>
                    <option value="Monitoring Report">Monitoring Report</option>
                    <option value="Verification Report">Verification Report</option>
                    <option value="Map / GIS File">Map / GIS File</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    Choose File *
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
                    <span>{uploading ? 'Uploading File...' : 'Upload Document'}</span>
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* Project Documents Table */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-forest-deep">Repository Documents</h2>
                <p className="text-xs text-stone-500">Official project-level documentation</p>
              </div>
              <span className="text-xs font-semibold text-stone-600">
                {documents.length} document{documents.length === 1 ? '' : 's'}
              </span>
            </div>

            {documents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/50 p-10 text-center">
                <FolderOpen size={36} className="mx-auto text-stone-400 mb-2" />
                <h3 className="text-base font-bold text-forest-deep">No documents uploaded yet</h3>
                <p className="mt-1 text-xs text-stone-600">
                  Upload Project Design Documents, baseline studies, or certificates above.
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
        </div>
      )}

      {/* TAB 2: Associated Participants List */}
      {activeTab === 'participants' && (
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-forest-deep">Associated Participants</h2>
              <p className="text-xs text-stone-500">
                Select a participant to inspect and upload land tenure, identity, or consent documents
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  placeholder="Filter participants..."
                  className="rounded-lg border border-stone-300 py-1.5 pl-9 pr-3 text-xs outline-none focus:border-forest"
                />
              </div>

              <Link
                to={`/projects/${project.id}/participants/new`}
                className="inline-flex items-center gap-1 rounded-lg bg-forest px-3 py-1.5 text-xs font-bold text-white hover:bg-forest-deep whitespace-nowrap"
              >
                <Plus size={14} />
                <span>Add Participant</span>
              </Link>
            </div>
          </div>

          {filteredParticipants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/50 p-10 text-center">
              <Users size={36} className="mx-auto text-stone-400 mb-2" />
              <h3 className="text-base font-bold text-forest-deep">No participants found</h3>
              <p className="mt-1 text-xs text-stone-600">
                {participantSearch
                  ? `No participants match "${participantSearch}".`
                  : 'No participants have been registered for this project yet.'}
              </p>
              <div className="mt-4">
                <Link
                  to={`/projects/${project.id}/participants/new`}
                  className="inline-flex items-center gap-1 rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest-deep"
                >
                  <Plus size={14} />
                  <span>Register First Participant</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-stone-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs font-bold uppercase tracking-wider text-stone-600 border-b border-stone-200">
                  <tr>
                    <th className="p-3.5">Participant Name</th>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Location / Plot</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-center">Documents</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredParticipants.map((p) => (
                    <tr key={p.id} className="transition hover:bg-stone-50/80">
                      <td className="p-3.5 font-bold text-forest-deep">
                        {p.fullName}
                      </td>
                      <td className="p-3.5 text-xs font-mono text-stone-500">
                        {p.participantCode || '—'}
                      </td>
                      <td className="p-3.5 text-xs text-stone-600">
                        {p.participantType}
                      </td>
                      <td className="p-3.5 text-xs text-stone-600">
                        {[p.village, p.plotId ? `Plot: ${p.plotId}` : null].filter(Boolean).join(' • ') || '—'}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-success border border-emerald-200">
                          {p.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-forest">
                          <FileText size={12} />
                          {p.documentCount ?? 0}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/documents/projects/${project.id}/participants/${p.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-forest-deep active:scale-95"
                        >
                          <FileText size={13} />
                          <span>View Documents</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}
