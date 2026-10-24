import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Download,
  MapPin,
  History,
  ShieldCheck,
  Check,
  X,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import { AppShell, PageHeader } from '../components/ui';
import {
  getMRVCycle,
  listMeasurements,
  listMeasurementTypes,
  transitionMRVCycle,
  attachEvidence,
  listEvidence,
  deleteEvidence,
  validateMeasurement,
  deleteMeasurement,
  generateReport,
  listMRVAuditLogs,
} from '../services/mrv.service';
import { getProject } from '../services/project.service';
import { listParticipants } from '../services/participant.service';
import { listProjectDocuments, uploadProjectDocument, downloadDocument } from '../services/document.service';
import { MRVCycle, Measurement, MeasurementType, Participant, Document, MRVEvidence } from '../types';

export function MRVCycleDetailsPage() {
  const { projectId, cycleId } = useParams<{ projectId: string; cycleId: string }>();
  const navigate = useNavigate();

  // State
  const [project, setProject] = useState<any>(null);
  const [cycle, setCycle] = useState<any>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [types, setTypes] = useState<MeasurementType[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [evidenceList, setEvidenceList] = useState<MRVEvidence[]>([]);
  const [projectDocs, setProjectDocs] = useState<Document[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'measurements' | 'evidence' | 'gis' | 'methodology' | 'audit'>('measurements');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filter state for measurements
  const [measurementStatusFilter, setMeasurementStatusFilter] = useState<string>('all');
  const [measurementCategoryFilter, setMeasurementCategoryFilter] = useState<string>('all');

  // Transition modal state
  const [transitionModal, setTransitionModal] = useState<{ open: boolean; targetStatus: string; label: string; requireComment: boolean } | null>(null);
  const [transitionComment, setTransitionComment] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  // Evidence attach modal state
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [attachMode, setAttachMode] = useState<'select' | 'upload'>('select');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedMeasurementId, setSelectedMeasurementId] = useState('');
  const [evidenceType, setEvidenceType] = useState('field_observation');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadSubmitting, setUploadSubmitting] = useState(false);

  // Load all data
  const loadData = async () => {
    if (!projectId || !cycleId) return;
    try {
      const [projData, cycleData, measData, typesData, partsData, evData, docsData, logsData] = await Promise.all([
        getProject(projectId),
        getMRVCycle(cycleId),
        listMeasurements(cycleId),
        listMeasurementTypes(),
        listParticipants(projectId).catch(() => ({ data: [] })),
        listEvidence(cycleId).catch(() => []),
        listProjectDocuments(projectId).catch(() => []),
        listMRVAuditLogs(projectId, cycleId).catch(() => []),
      ]);

      setProject(projData);
      setCycle(cycleData);
      setMeasurements(measData.data || []);
      setTypes(typesData.data || []);
      setParticipants(partsData.data || []);
      setEvidenceList(evData || []);
      setProjectDocs(docsData || []);
      setAuditLogs(logsData || []);
    } catch (err: any) {
      console.error('Failed to load MRV cycle details:', err);
      setActionError(err?.response?.data?.error || 'Failed to load monitoring cycle data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId, cycleId]);

  // Handle status transition
  const handleTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitionModal || !cycleId) return;
    setTransitioning(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const updated = await transitionMRVCycle(cycleId, {
        targetStatus: transitionModal.targetStatus,
        comment: transitionComment || undefined,
      });
      setCycle(updated);
      setActionSuccess(`Cycle status transitioned to ${transitionModal.targetStatus.replace(/_/g, ' ')} successfully.`);
      setTransitionModal(null);
      setTransitionComment('');
      loadData();
    } catch (err: any) {
      console.error('Transition failed:', err);
      setActionError(err?.response?.data?.error || 'Failed to transition cycle status.');
    } finally {
      setTransitioning(false);
    }
  };

  // Handle measurement validation
  const handleValidateMeasurement = async (id: string, status: 'valid' | 'invalid' | 'needs_correction') => {
    const notes = prompt(`Enter review notes for marking measurement as "${status}":`) || '';
    setActionError(null);
    try {
      await validateMeasurement(id, { status, validationNotes: notes });
      setActionSuccess(`Measurement status updated to ${status}.`);
      loadData();
    } catch (err: any) {
      console.error('Validation failed:', err);
      setActionError(err?.response?.data?.error || 'Failed to update measurement status.');
    }
  };

  // Handle measurement deletion
  const handleDeleteMeasurement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this measurement record?')) return;
    setActionError(null);
    try {
      await deleteMeasurement(id);
      setMeasurements(measurements.filter((m) => m.id !== id));
      setActionSuccess('Measurement deleted.');
    } catch (err: any) {
      console.error('Failed to delete measurement:', err);
      setActionError(err?.response?.data?.error || 'Failed to delete measurement.');
    }
  };

  // Handle evidence attachment
  const handleAttachEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleId || !projectId) return;
    setUploadSubmitting(true);
    setActionError(null);

    try {
      let docIdToAttach = selectedDocId;

      if (attachMode === 'upload') {
        if (!uploadFile) {
          setActionError('Please select a file to upload.');
          setUploadSubmitting(false);
          return;
        }
        const uploadedDoc = await uploadProjectDocument(
          projectId,
          uploadFile,
          uploadName || uploadFile.name,
          'Field Observation',
          evidenceDescription
        );
        docIdToAttach = uploadedDoc.id;
      }

      if (!docIdToAttach) {
        setActionError('Please choose or upload a document.');
        setUploadSubmitting(false);
        return;
      }

      await attachEvidence(cycleId, {
        documentId: docIdToAttach,
        measurementId: selectedMeasurementId || undefined,
        evidenceType,
        description: evidenceDescription || undefined,
      });

      setShowAttachModal(false);
      setUploadFile(null);
      setUploadName('');
      setSelectedDocId('');
      setSelectedMeasurementId('');
      setEvidenceDescription('');
      setActionSuccess('Evidence attached successfully to cycle.');
      loadData();
    } catch (err: any) {
      console.error('Evidence attachment error:', err);
      setActionError(err?.response?.data?.error || 'Failed to attach evidence.');
    } finally {
      setUploadSubmitting(false);
    }
  };

  // Handle evidence detachment
  const handleDeleteEvidence = async (id: string) => {
    if (!confirm('Detach this evidence document from the monitoring cycle?')) return;
    try {
      await deleteEvidence(id);
      setEvidenceList(evidenceList.filter((e) => e.id !== id));
      setActionSuccess('Evidence detached.');
    } catch (err: any) {
      console.error('Evidence delete failed:', err);
      setActionError(err?.response?.data?.error || 'Failed to detach evidence.');
    }
  };

  // Handle generate report
  const handleGenerateReport = async () => {
    if (!cycleId) return;
    setActionError(null);
    try {
      const rep = await generateReport(cycleId);
      setActionSuccess('Monitoring report generated successfully!');
      loadData();
      if (rep?.id) {
        navigate(`/projects/${projectId}/mrv/${cycleId}/report/${rep.id}`);
      }
    } catch (err: any) {
      console.error('Report generation error:', err);
      setActionError(err?.response?.data?.error || 'Failed to generate report.');
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-stone-200 border-t-forest" />
        </div>
      </AppShell>
    );
  }

  if (!cycle) {
    return (
      <AppShell>
        <div className="p-8 text-center bg-white rounded-xl border border-stone-200">
          <AlertTriangle className="mx-auto text-amber-500 mb-2" size={32} />
          <h2 className="text-lg font-bold text-forest-deep">Cycle Not Found</h2>
          <p className="text-sm text-stone-600 mt-1">The requested monitoring cycle does not exist or you lack permission to view it.</p>
          <button
            onClick={() => navigate(`/projects/${projectId}/mrv`)}
            className="mt-4 rounded bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest-deep"
          >
            Back to Project MRV
          </button>
        </div>
      </AppShell>
    );
  }

  // Filtered measurements
  const filteredMeasurements = measurements.filter((m) => {
    if (measurementStatusFilter !== 'all' && m.status !== measurementStatusFilter) return false;
    if (measurementCategoryFilter !== 'all' && m.dataCategory !== measurementCategoryFilter) return false;
    return true;
  });

  // Calculate statistics
  const totalMeasurements = measurements.length;
  const validCount = measurements.filter((m) => m.status === 'valid').length;
  const invalidCount = measurements.filter((m) => m.status === 'invalid').length;
  const submittedCount = measurements.filter((m) => m.status === 'submitted').length;
  const draftCount = measurements.filter((m) => m.status === 'draft').length;
  const validationRate = totalMeasurements > 0 ? ((validCount / totalMeasurements) * 100).toFixed(0) : '0';

  // State transitions available based on current status
  const getAvailableTransitions = (status: string) => {
    switch (status) {
      case 'draft':
        return [{ target: 'data_collection', label: 'Start Data Collection', requireComment: false, tone: 'primary' }];
      case 'data_collection':
        return [
          { target: 'data_submitted', label: 'Submit Cycle for Validation', requireComment: false, tone: 'primary' },
        ];
      case 'data_submitted':
        return [
          { target: 'validation', label: 'Begin Validation Review', requireComment: false, tone: 'primary' },
          { target: 'needs_correction', label: 'Request Changes', requireComment: true, tone: 'warning' },
        ];
      case 'validation':
        return [
          { target: 'validated', label: 'Approve & Mark Validated', requireComment: false, tone: 'success' },
          { target: 'needs_correction', label: 'Request Corrections', requireComment: true, tone: 'warning' },
          { target: 'rejected', label: 'Reject Cycle Data', requireComment: true, tone: 'danger' },
        ];
      case 'needs_correction':
        return [
          { target: 'data_collection', label: 'Resume Data Collection', requireComment: false, tone: 'primary' },
        ];
      case 'validated':
        return [
          { target: 'report_generated', label: 'Advance to Report Stage', requireComment: false, tone: 'primary' },
        ];
      case 'report_generated':
        return [
          { target: 'submitted_for_verification', label: 'Submit for External Verification', requireComment: false, tone: 'primary' },
        ];
      case 'submitted_for_verification':
        return [
          { target: 'under_verification', label: 'Start Verification Review', requireComment: false, tone: 'primary' },
        ];
      case 'under_verification':
        return [
          { target: 'verified', label: 'Record Final Verification (Approve)', requireComment: true, tone: 'success' },
          { target: 'needs_correction', label: 'Request Verifier Revisions', requireComment: true, tone: 'warning' },
          { target: 'rejected', label: 'Reject Verification', requireComment: true, tone: 'danger' },
        ];
      default:
        return [];
    }
  };

  const availableTransitions = getAvailableTransitions(cycle.status);

  return (
    <AppShell>
      {/* Breadcrumb & Top Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-stone-500 font-medium">
        <Link to="/mrv" className="hover:text-forest">MRV Hub</Link>
        <ChevronRight size={12} />
        <Link to={`/projects/${projectId}`} className="hover:text-forest">{project?.name || 'Project'}</Link>
        <ChevronRight size={12} />
        <Link to={`/projects/${projectId}/mrv`} className="hover:text-forest">Monitoring Cycles</Link>
        <ChevronRight size={12} />
        <span className="text-forest-deep font-semibold">{cycle.cycleName}</span>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-danger">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-stone-400 hover:text-stone-600"><X size={14} /></button>
        </div>
      )}
      {actionSuccess && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-success">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-stone-400 hover:text-stone-600"><X size={14} /></button>
        </div>
      )}

      {/* Header Card */}
      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-forest uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {cycle.cycleCode}
              </span>
              <span
                className={`rounded px-2.5 py-0.5 text-xs font-bold capitalize border ${
                  cycle.status === 'verified'
                    ? 'bg-emerald-50 text-success border-emerald-200'
                    : cycle.status === 'rejected'
                      ? 'bg-red-50 text-danger border-red-200'
                      : cycle.status === 'needs_correction'
                        ? 'bg-amber-50 text-warning border-amber-200'
                        : 'bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                {cycle.status.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-forest-deep">{cycle.cycleName}</h1>
            <p className="mt-1 text-xs text-stone-500 max-w-2xl">{cycle.description || 'No description recorded for this cycle.'}</p>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-stone-600">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-forest" />
                <span>Period: <strong>{new Date(cycle.monitoringStartDate).toLocaleDateString()}</strong> to <strong>{new Date(cycle.monitoringEndDate).toLocaleDateString()}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-forest" />
                <span>Project: <strong>{project?.name}</strong> ({project?.stateRegion || project?.country || 'India'})</span>
              </div>
            </div>
          </div>

          {/* Workflow Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {availableTransitions.map((t) => (
              <button
                key={t.target}
                onClick={() => setTransitionModal({ open: true, targetStatus: t.target, label: t.label, requireComment: t.requireComment })}
                className={`rounded-lg px-3.5 py-2 text-xs font-bold shadow-xs transition ${
                  t.tone === 'success'
                    ? 'bg-success text-white hover:bg-emerald-700'
                    : t.tone === 'danger'
                      ? 'bg-danger text-white hover:bg-red-700'
                      : t.tone === 'warning'
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'bg-forest text-white hover:bg-forest-deep'
                }`}
              >
                {t.label}
              </button>
            ))}

            {(cycle.status === 'validated' || cycle.status === 'report_generated' || cycle.status === 'verified') && (
              <button
                onClick={handleGenerateReport}
                className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
              >
                <FileSpreadsheet size={14} className="text-forest" />
                <span>Generate / Update Report</span>
              </button>
            )}

            {cycle.reports && cycle.reports.length > 0 && (
              <button
                onClick={() => navigate(`/projects/${projectId}/mrv/${cycleId}/report/${cycle.reports[0].id}`)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-bold text-forest hover:bg-emerald-100"
              >
                <FileText size={14} />
                <span>View Monitoring Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 pt-5 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-xl bg-stone-50 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Total Measurements</span>
            <p className="mt-1 text-xl font-bold text-forest-deep">{totalMeasurements}</p>
          </div>
          <div className="rounded-xl bg-stone-50 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Validation Rate</span>
            <p className="mt-1 text-xl font-bold text-forest">{validationRate}%</p>
          </div>
          <div className="rounded-xl bg-emerald-50/50 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Valid</span>
            <p className="mt-1 text-xl font-bold text-success">{validCount}</p>
          </div>
          <div className="rounded-xl bg-amber-50/50 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Submitted / Pending</span>
            <p className="mt-1 text-xl font-bold text-warning">{submittedCount}</p>
          </div>
          <div className="rounded-xl bg-red-50/50 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-800">Invalid / Edits</span>
            <p className="mt-1 text-xl font-bold text-danger">{invalidCount}</p>
          </div>
          <div className="rounded-xl bg-stone-50 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Attached Evidence</span>
            <p className="mt-1 text-xl font-bold text-forest-deep">{evidenceList.length}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-stone-200 flex gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('measurements')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'measurements' ? 'border-forest text-forest' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Measurements ({measurements.length})
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'evidence' ? 'border-forest text-forest' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Evidence & Documents ({evidenceList.length})
        </button>
        <button
          onClick={() => setActiveTab('gis')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'gis' ? 'border-forest text-forest' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          GIS & Plot Integration
        </button>
        <button
          onClick={() => setActiveTab('methodology')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'methodology' ? 'border-forest text-forest' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Methodology & Calculations
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'audit' ? 'border-forest text-forest' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Audit History ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: MEASUREMENTS */}
      {activeTab === 'measurements' && (
        <div>
          {/* Filter & Action Bar */}
          <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={measurementStatusFilter}
                onChange={(e) => setMeasurementStatusFilter(e.target.value)}
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-700 font-medium"
              >
                <option value="all">All Statuses ({measurements.length})</option>
                <option value="valid">Valid ({validCount})</option>
                <option value="submitted">Submitted ({submittedCount})</option>
                <option value="draft">Draft ({draftCount})</option>
                <option value="invalid">Invalid ({invalidCount})</option>
                <option value="needs_correction">Needs Correction</option>
              </select>

              <select
                value={measurementCategoryFilter}
                onChange={(e) => setMeasurementCategoryFilter(e.target.value)}
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-700 font-medium"
              >
                <option value="all">All Categories</option>
                <option value="baseline">Baseline Data</option>
                <option value="project">Project Activity</option>
                <option value="monitoring">Monitoring Observation</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => navigate(`/projects/${projectId}/mrv/${cycleId}/measurements`)}
                className="flex items-center gap-1.5 rounded-lg bg-forest px-3.5 py-2 text-xs font-bold text-white hover:bg-forest-deep shadow-xs"
              >
                <Plus size={14} />
                <span>Record Measurement</span>
              </button>
            </div>
          </div>

          {/* Measurements Table */}
          {filteredMeasurements.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
              <FileSpreadsheet size={36} className="mx-auto text-forest mb-2" />
              <h3 className="text-sm font-bold text-forest-deep">No measurements match criteria</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                {measurements.length === 0
                  ? 'Start by recording field, lab, or sensor observations for this monitoring period.'
                  : 'Adjust your status or category filters.'}
              </p>
              <button
                onClick={() => navigate(`/projects/${projectId}/mrv/${cycleId}/measurements`)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest-deep"
              >
                <Plus size={14} />
                <span>Add First Measurement</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-xs">
              <table className="w-full min-w-[850px] text-left text-xs">
                <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Measurement Type</th>
                    <th className="py-3 px-4">Value & Unit</th>
                    <th className="py-3 px-4">Category / Source</th>
                    <th className="py-3 px-4">Participant / Plot</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredMeasurements.map((m) => {
                    const type = types.find((t) => t.id === m.measurementTypeId);
                    const participant = participants.find((p) => p.id === m.participantId);

                    return (
                      <tr key={m.id} className="hover:bg-stone-50/60 transition">
                        <td className="py-3 px-4">
                          <p className="font-bold text-forest-deep">{type?.name || type?.measurementName || 'Measurement'}</p>
                          <span className="text-[10px] text-stone-400 font-mono">{type?.category || 'Standard'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-stone-800 text-sm">{m.value.toLocaleString()}</span>{' '}
                          <span className="text-stone-500 font-medium">{m.unit}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-stone-100 text-stone-600">
                            {m.dataCategory}
                          </span>
                          <span className="block text-[10px] text-stone-400 mt-0.5 capitalize">{m.source}</span>
                        </td>
                        <td className="py-3 px-4">
                          {participant ? (
                            <div>
                              <p className="font-semibold text-stone-700">{participant.fullName}</p>
                              <span className="text-[10px] text-stone-400 font-mono">{participant.participantCode}</span>
                            </div>
                          ) : (
                            <span className="text-stone-400 italic">Project Level</span>
                          )}
                          {m.plotReference && (
                            <p className="text-[10px] text-emerald-700 font-mono mt-0.5">Plot: {m.plotReference}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-stone-600">
                          {new Date(m.measurementDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold capitalize border ${
                              m.status === 'valid'
                                ? 'bg-emerald-50 text-success border-emerald-200'
                                : m.status === 'invalid'
                                  ? 'bg-red-50 text-danger border-red-200'
                                  : m.status === 'submitted'
                                    ? 'bg-amber-50 text-warning border-amber-200'
                                    : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}
                          >
                            {m.status}
                          </span>
                          {m.validationNotes && (
                            <p className="text-[10px] text-stone-500 italic mt-0.5 line-clamp-1" title={m.validationNotes}>
                              {m.validationNotes}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {m.status === 'submitted' && (
                              <>
                                <button
                                  onClick={() => handleValidateMeasurement(m.id, 'valid')}
                                  title="Approve / Mark Valid"
                                  className="rounded p-1 bg-emerald-50 text-success hover:bg-emerald-100"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => handleValidateMeasurement(m.id, 'invalid')}
                                  title="Mark Invalid"
                                  className="rounded p-1 bg-red-50 text-danger hover:bg-red-100"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteMeasurement(m.id)}
                              title="Delete Measurement"
                              className="rounded p-1 text-stone-400 hover:text-danger hover:bg-stone-100"
                            >
                              <Trash2 size={14} />
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
        </div>
      )}

      {/* TAB 2: EVIDENCE & DOCUMENTS */}
      {activeTab === 'evidence' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-stone-500">
              Supporting documentation, field imagery, spreadsheets, and lab certificates connected directly to this monitoring cycle.
            </p>
            <button
              onClick={() => setShowAttachModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-forest px-3.5 py-2 text-xs font-bold text-white hover:bg-forest-deep shadow-xs"
            >
              <Upload size={14} />
              <span>Attach Evidence</span>
            </button>
          </div>

          {evidenceList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
              <FileText size={36} className="mx-auto text-forest mb-2" />
              <h3 className="text-sm font-bold text-forest-deep">No evidence attached yet</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Attach existing documents from your Documents Vault or upload new geotagged photos, field logs, or third-party reports.
              </p>
              <button
                onClick={() => setShowAttachModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest-deep"
              >
                <Upload size={14} />
                <span>Attach First Evidence File</span>
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {evidenceList.map((ev) => (
                <div key={ev.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest border border-emerald-200">
                        {ev.evidenceType.replace(/_/g, ' ')}
                      </span>
                      <button
                        onClick={() => handleDeleteEvidence(ev.id)}
                        title="Detach Evidence"
                        className="text-stone-400 hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <h4 className="mt-2 text-sm font-bold text-forest-deep truncate" title={ev.document?.documentName || 'Document'}>
                      {ev.document?.documentName || 'Evidence File'}
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">{ev.description || 'No description provided.'}</p>

                    {ev.measurement && (
                      <div className="mt-2 text-[10px] text-stone-600 bg-stone-50 p-2 rounded">
                        <span>Linked to: <strong>{ev.measurement.value} {ev.measurement.unit}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-stone-400">
                      {new Date(ev.attachedAt || ev.createdAt).toLocaleDateString()}
                    </span>
                    {ev.documentId && (
                      <button
                        onClick={() => downloadDocument(ev.documentId, ev.document?.documentName)}
                        className="flex items-center gap-1 text-forest font-bold hover:underline"
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GIS & PLOT CONTEXT */}
      {activeTab === 'gis' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-forest-deep">Spatial & GIS Project Context</h3>
                <p className="text-xs text-stone-600 mt-1 max-w-xl">
                  MRV measurements are grounded in verified geographical boundaries. Plot references and GPS coordinates are checked against the project's perimeter to prevent double-counting and outside-boundary leakages.
                </p>
              </div>
              <button
                onClick={() => navigate(`/projects/${projectId}/gis`)}
                className="flex items-center gap-1.5 rounded-lg border border-forest bg-forest/5 px-3 py-1.5 text-xs font-bold text-forest hover:bg-forest/10"
              >
                <Layers size={14} />
                <span>Open Project GIS Map</span>
                <ExternalLink size={12} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-100">
              <div className="rounded-lg bg-stone-50 p-3">
                <span className="text-[10px] font-bold uppercase text-stone-500">Project Area</span>
                <p className="mt-1 text-lg font-bold text-forest-deep">
                  {project?.gisData?.totalAreaHa ? `${project.gisData.totalAreaHa.toLocaleString()} ha` : 'Registered GIS Boundary'}
                </p>
              </div>
              <div className="rounded-lg bg-stone-50 p-3">
                <span className="text-[10px] font-bold uppercase text-stone-500">GIS Reference System</span>
                <p className="mt-1 text-lg font-bold text-stone-700">WGS84 / EPSG:4326</p>
              </div>
              <div className="rounded-lg bg-stone-50 p-3">
                <span className="text-[10px] font-bold uppercase text-stone-500">Spatial Measurements</span>
                <p className="mt-1 text-lg font-bold text-forest">
                  {measurements.filter((m) => m.locationCoordinates || m.plotReference).length} with plot/GPS
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <h4 className="text-sm font-bold text-forest-deep mb-3">Measurements with Spatial References</h4>
            {measurements.filter((m) => m.locationCoordinates || m.plotReference).length === 0 ? (
              <p className="text-xs text-stone-500 italic">No measurements have specific plot references or GPS coordinates recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {measurements
                  .filter((m) => m.locationCoordinates || m.plotReference)
                  .map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-stone-50 text-xs">
                      <div>
                        <span className="font-bold text-forest-deep">{m.value} {m.unit}</span>
                        <span className="text-stone-500 ml-2">({new Date(m.measurementDate).toLocaleDateString()})</span>
                        {m.plotReference && <p className="text-[11px] text-forest font-mono mt-0.5">Plot: {m.plotReference}</p>}
                      </div>
                      {m.locationCoordinates && (
                        <span className="font-mono text-[10px] text-stone-600 bg-white px-2 py-1 rounded border border-stone-200">
                          {m.locationCoordinates}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: METHODOLOGY & CALCULATIONS */}
      {activeTab === 'methodology' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 text-xs text-stone-700">
            <div className="flex items-start gap-3">
              <Info className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="font-bold text-stone-900">Methodology & Certification Safety Disclosure</h4>
                <p className="mt-1 leading-relaxed">
                  This MRV module stores empirical measurements, auditable raw parameters, and validation logs. Internal platform approval represents CPMS quality assurance and does <strong>not</strong> claim external carbon registry certification (e.g., Verra VCS, Gold Standard, UNFCCC Article 6) or automated carbon credit issuance.
                </p>
                <p className="mt-2 text-stone-600">
                  Carbon project methodology: <strong>{project?.methodology || 'Afforestation / Reforestation / Biomass (ARR)'}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <h4 className="text-sm font-bold text-forest-deep mb-3">Empirical Measurement Summary by Category</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              {['baseline', 'project', 'monitoring'].map((cat) => {
                const catMeas = measurements.filter((m) => m.dataCategory === cat);
                const validCat = catMeas.filter((m) => m.status === 'valid');
                return (
                  <div key={cat} className="rounded-xl bg-stone-50 p-4 border border-stone-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-forest capitalize">{cat} Records</span>
                    <p className="mt-2 text-2xl font-bold text-forest-deep">{catMeas.length}</p>
                    <p className="mt-1 text-xs text-stone-500">{validCat.length} verified valid</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100">
              <h5 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Aggregated Raw Metrics</h5>
              <div className="space-y-1.5 text-xs text-stone-600">
                {measurements.length === 0 ? (
                  <p className="italic text-stone-400">No empirical values recorded yet.</p>
                ) : (
                  Array.from(new Set(measurements.map((m) => m.unit))).map((unit) => {
                    const sum = measurements.filter((m) => m.unit === unit && m.status === 'valid').reduce((acc, curr) => acc + Number(curr.value || 0), 0);
                    return (
                      <div key={unit} className="flex justify-between py-1 border-b border-stone-100">
                        <span>Sum of Validated {unit}:</span>
                        <strong className="text-forest-deep font-mono">{sum.toLocaleString()} {unit}</strong>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-forest-deep">Immutable MRV Activity Trail</h3>
            <span className="text-[10px] text-stone-400 font-mono">Logged by System</span>
          </div>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-stone-500 italic py-6 text-center">No audit records logged for this cycle yet.</p>
          ) : (
            <div className="relative pl-6 space-y-4 border-l-2 border-stone-200">
              {auditLogs.map((log) => (
                <div key={log.id} className="relative">
                  <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-forest border-2 border-white" />
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-bold text-forest-deep uppercase tracking-wider">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-stone-400">{new Date(log.timestamp || log.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Actor: <span className="font-semibold text-stone-800">{log.performedBy || 'System Admin'}</span>
                  </p>
                  {log.changes && (
                    <p className="text-[11px] text-stone-500 font-mono mt-1 bg-stone-50 p-2 rounded">
                      {typeof log.changes === 'object' ? JSON.stringify(log.changes) : log.changes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TRANSITION MODAL */}
      {transitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-forest-deep">Confirm Status Transition</h3>
            <p className="text-xs text-stone-600 mt-1">
              Transition cycle <strong>{cycle.cycleName}</strong> to{' '}
              <span className="font-bold text-forest uppercase">{transitionModal.targetStatus.replace(/_/g, ' ')}</span>.
            </p>

            <form onSubmit={handleTransitionSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700">
                  Reviewer / Transition Comment {transitionModal.requireComment && '*'}
                </label>
                <textarea
                  value={transitionComment}
                  onChange={(e) => setTransitionComment(e.target.value)}
                  placeholder="Record justification, notes, or required revisions..."
                  rows={3}
                  required={transitionModal.requireComment}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 text-xs text-stone-800 outline-none focus:border-forest"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransitionModal(null)}
                  disabled={transitioning}
                  className="rounded-lg border border-stone-300 px-3.5 py-2 text-xs font-bold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transitioning}
                  className="rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest-deep disabled:opacity-50"
                >
                  {transitioning ? 'Saving...' : 'Confirm Transition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTACH EVIDENCE MODAL */}
      {showAttachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-forest-deep">Attach Evidence Document</h3>
              <button onClick={() => setShowAttachModal(false)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex gap-3 border-b border-stone-200 pb-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAttachMode('select')}
                className={`pb-1 ${attachMode === 'select' ? 'text-forest border-b-2 border-forest' : 'text-stone-500'}`}
              >
                Select from Documents Vault ({projectDocs.length})
              </button>
              <button
                type="button"
                onClick={() => setAttachMode('upload')}
                className={`pb-1 ${attachMode === 'upload' ? 'text-forest border-b-2 border-forest' : 'text-stone-500'}`}
              >
                Upload New Document
              </button>
            </div>

            <form onSubmit={handleAttachEvidence} className="mt-4 space-y-3 text-xs">
              {attachMode === 'select' ? (
                <div>
                  <label className="block font-bold text-stone-700">Choose Project Document *</label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-xs"
                  >
                    <option value="">Select a document...</option>
                    {projectDocs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.documentName} ({d.documentType})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-stone-700">Document File *</label>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadFile(file);
                          if (!uploadName) setUploadName(file.name);
                        }
                      }}
                      required
                      className="mt-1 w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700">Document Title</label>
                    <input
                      type="text"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="e.g., Q1 Canopy Survey Sheet"
                      className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-xs"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold text-stone-700">Evidence Category *</label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-xs"
                >
                  <option value="field_observation">Field Observation</option>
                  <option value="photo">Photographic Proof</option>
                  <option value="satellite_imagery">Satellite Imagery</option>
                  <option value="lab_report">Laboratory Certificate</option>
                  <option value="gis_survey">GIS / GPS Survey</option>
                  <option value="monitoring_spreadsheet">Monitoring Spreadsheet</option>
                  <option value="third_party_audit">Third-Party Audit Note</option>
                  <option value="other">Other Supporting Material</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700">Link to Specific Measurement (Optional)</label>
                <select
                  value={selectedMeasurementId}
                  onChange={(e) => setSelectedMeasurementId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-xs"
                >
                  <option value="">Entire Cycle (Project Level)</option>
                  {measurements.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.value} {m.unit} — {new Date(m.measurementDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700">Description / Verification Notes</label>
                <textarea
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  placeholder="Notes on methodology, collection device, coordinates, or validation rationale..."
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-xs"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAttachModal(false)}
                  disabled={uploadSubmitting}
                  className="rounded-lg border border-stone-300 px-3.5 py-2 text-xs font-bold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadSubmitting}
                  className="rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest-deep disabled:opacity-50"
                >
                  {uploadSubmitting ? 'Attaching...' : 'Attach Evidence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
