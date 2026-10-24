import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  RefreshCw,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Layers,
  ChevronRight,
  Filter,
  ShieldCheck,
  Calendar,
  X,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { AppShell, PageHeader } from '../components/ui';
import { listProjects } from '../services/project.service';
import { getMRVDashboardStats, createMRVCycle } from '../services/mrv.service';
import { Project } from '../types';

export function GlobalMRVPage() {
  const navigate = useNavigate();

  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Create Cycle Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalProjectId, setModalProjectId] = useState('');
  const [createForm, setCreateForm] = useState({
    cycleName: '',
    cycleCode: '',
    monitoringStartDate: '',
    monitoringEndDate: '',
    description: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectsRes, statsRes] = await Promise.all([
        listProjects(undefined, undefined, undefined, 1, 100, 'name', 'ASC'),
        getMRVDashboardStats(selectedProjectId !== 'all' ? selectedProjectId : undefined),
      ]);
      setProjects(projectsRes.data || []);
      setDashboardData(statsRes);
      if (!modalProjectId && projectsRes.data?.length > 0) {
        setModalProjectId(projectsRes.data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load MRV dashboard:', err);
      setError(err?.response?.data?.error || 'Failed to load MRV monitoring data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedProjectId]);

  const handleCreateCycleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalProjectId) {
      setCreateError('Please select a project');
      return;
    }
    setCreateSubmitting(true);
    setCreateError(null);

    try {
      const created = await createMRVCycle(modalProjectId, createForm);
      setShowCreateModal(false);
      setCreateForm({
        cycleName: '',
        cycleCode: '',
        monitoringStartDate: '',
        monitoringEndDate: '',
        description: '',
      });
      navigate(`/projects/${modalProjectId}/mrv/${created.id}`);
    } catch (err: any) {
      console.error('Create MRV cycle error:', err);
      setCreateError(err?.response?.data?.error || 'Failed to create monitoring cycle.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Filter cycles
  const allCycles: any[] = dashboardData?.cycles || [];
  const filteredCycles = allCycles.filter((c) => {
    if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = c.cycleName?.toLowerCase().includes(q);
      const matchCode = c.cycleCode?.toLowerCase().includes(q);
      const matchProject = c.project?.name?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchProject) return false;
    }
    return true;
  });

  const summary = dashboardData?.summary || {
    totalCycles: 0,
    draftCycles: 0,
    dataCollectionCycles: 0,
    underReviewCycles: 0,
    verifiedCycles: 0,
    rejectedCycles: 0,
    totalMeasurements: 0,
    validMeasurements: 0,
    totalEvidenceCount: 0,
    totalReports: 0,
  };

  const attentionItems: any[] = dashboardData?.attentionItems || [];
  const projectSummaries: any[] = dashboardData?.projectSummaries || [];
  const recentActivity: any[] = dashboardData?.recentActivity || [];

  return (
    <AppShell>
      <PageHeader
        title="MRV Monitoring & Verification Hub"
        description="Comprehensive monitoring cycles, empirical measurements, evidence documentation, and verification workflows."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-xs transition hover:bg-stone-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-forest-deep"
            >
              <Plus size={14} />
              <span>New Monitoring Cycle</span>
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-danger">
          {error}
        </div>
      )}

      {/* Real Live Metrics Bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Total Cycles</span>
          <p className="mt-2 text-2xl font-bold text-forest-deep">{summary.totalCycles}</p>
          <span className="text-[10px] text-stone-400">Across active projects</span>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Data Collection</span>
          <p className="mt-2 text-2xl font-bold text-forest">{summary.dataCollectionCycles}</p>
          <span className="text-[10px] text-stone-400">Field measurements active</span>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Under Review</span>
          <p className="mt-2 text-2xl font-bold text-warning">{summary.underReviewCycles}</p>
          <span className="text-[10px] text-stone-400">Awaiting QA / Verifier</span>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Verified</span>
          <p className="mt-2 text-2xl font-bold text-success">{summary.verifiedCycles}</p>
          <span className="text-[10px] text-stone-400">Verified monitoring periods</span>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Valid Measurements</span>
          <p className="mt-2 text-2xl font-bold text-forest-deep">{summary.validMeasurements}</p>
          <span className="text-[10px] text-stone-400">Of {summary.totalMeasurements} total</span>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Attached Evidence</span>
          <p className="mt-2 text-2xl font-bold text-forest-deep">{summary.totalEvidenceCount}</p>
          <span className="text-[10px] text-stone-400">Document vault links</span>
        </div>
      </div>

      {/* Attention Items Banner */}
      {attentionItems.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900 mb-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <span>Items Requiring Immediate Attention ({attentionItems.length})</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {attentionItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/projects/${item.projectId}/mrv/${item.id}`)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-amber-200 hover:border-amber-400 cursor-pointer transition shadow-2xs"
              >
                <div>
                  <p className="font-bold text-stone-800 truncate">{item.cycleName}</p>
                  <span className="text-[10px] text-amber-700 capitalize font-medium">{item.status.replace(/_/g, ' ')}</span>
                </div>
                <ArrowRight size={14} className="text-amber-700 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cycles or projects..."
              className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-xs text-stone-800 placeholder-stone-400 outline-none focus:border-forest"
            />
          </div>

          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-700 font-medium"
          >
            <option value="all">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-700 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="data_collection">Data Collection</option>
            <option value="data_submitted">Data Submitted</option>
            <option value="validation">Validation</option>
            <option value="needs_correction">Needs Correction</option>
            <option value="validated">Validated</option>
            <option value="report_generated">Report Generated</option>
            <option value="submitted_for_verification">Submitted for Verification</option>
            <option value="under_verification">Under Verification</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <p className="text-xs font-semibold text-stone-500 self-end md:self-auto">
          Showing <span className="font-bold text-forest">{filteredCycles.length}</span> monitoring cycles
        </p>
      </div>

      {/* Main Grid: Monitoring Cycles & Project Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Cycles List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-forest-deep uppercase tracking-wider">Active Monitoring Cycles</h2>
          </div>

          {loading ? (
            <div className="py-20 text-center bg-white rounded-xl border border-stone-200">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-3 border-stone-200 border-t-forest" />
              <p className="text-xs font-medium text-stone-500">Loading monitoring cycles...</p>
            </div>
          ) : filteredCycles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
              <Activity size={36} className="mx-auto text-forest mb-2" />
              <h3 className="text-sm font-bold text-forest-deep">No monitoring cycles found</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                {allCycles.length === 0
                  ? 'No MRV cycles have been created yet. Launch a monitoring cycle for any active project to start recording measurements.'
                  : 'Try adjusting your status or project filters.'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest-deep"
              >
                <Plus size={14} />
                <span>Create First Monitoring Cycle</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCycles.map((cycle) => (
                <div
                  key={cycle.id}
                  onClick={() => navigate(`/projects/${cycle.projectId}/mrv/${cycle.id}`)}
                  className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition hover:border-emerald-500/50 hover:shadow-md cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-forest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                          {cycle.cycleCode}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold capitalize border ${
                            cycle.status === 'verified'
                              ? 'bg-emerald-50 text-success border-emerald-200'
                              : cycle.status === 'rejected'
                                ? 'bg-red-50 text-danger border-red-200'
                                : cycle.status === 'needs_correction'
                                  ? 'bg-amber-50 text-warning border-amber-200'
                                  : 'bg-stone-100 text-stone-600 border-stone-200'
                          }`}
                        >
                          {cycle.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="mt-1 text-base font-bold text-forest-deep">{cycle.cycleName}</h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Project: <strong>{cycle.project?.name || 'Assigned Project'}</strong> ({cycle.project?.projectCode})
                      </p>
                    </div>

                    <div className="text-right sm:text-right text-xs text-stone-500">
                      <div className="flex items-center gap-1 sm:justify-end">
                        <Calendar size={13} className="text-forest" />
                        <span>{new Date(cycle.monitoringStartDate).toLocaleDateString()} – {new Date(cycle.monitoringEndDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cycle Progress Stats */}
                  <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-stone-400">Measurements</span>
                      <p className="font-bold text-stone-800">
                        {cycle.stats?.submittedMeasurements || 0} / {cycle.stats?.totalMeasurements || 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-stone-400">Validation</span>
                      <p className="font-bold text-forest">
                        {cycle.stats?.validationPercentage ? cycle.stats.validationPercentage.toFixed(0) : 0}%
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-stone-400">Participants</span>
                      <p className="font-bold text-stone-800">
                        {cycle.stats?.participantsWithData || 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs pt-2">
                    <span className="text-stone-400 text-[11px]">
                      Created {new Date(cycle.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 text-forest font-bold hover:underline">
                      <span>View Cycle Details</span>
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Project Summaries & Recent Activity (1 col) */}
        <div className="space-y-6">
          {/* Projects Monitoring Snapshot */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest-deep mb-3">Monitoring By Project</h3>
            <div className="space-y-2.5">
              {projects.length === 0 ? (
                <p className="text-xs text-stone-500 italic">No projects registered yet.</p>
              ) : (
                projects.slice(0, 5).map((p) => {
                  const pSummary = projectSummaries.find((s) => s.projectId === p.id);
                  const pCyclesCount = pSummary ? pSummary.totalCycles : 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}/mrv`)}
                      className="p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-stone-800 truncate max-w-[170px]" title={p.name}>{p.name}</p>
                        <span className="text-[10px] text-stone-400 font-mono">{p.projectCode}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-forest">{pCyclesCount}</span>
                        <span className="text-[10px] text-stone-400 block">cycles</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 text-center">
              <Link to="/projects" className="text-xs font-bold text-forest hover:underline">
                View All Projects →
              </Link>
            </div>
          </div>

          {/* Recent MRV Activity Feed */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest-deep mb-3">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-4 text-center">No recent MRV activity logged.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 6).map((act) => (
                  <div key={act.id} className="text-xs border-b border-stone-100 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-700 capitalize">
                        {act.action?.replace(/_/g, ' ') || 'Action'}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(act.timestamp || act.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      By {act.performedBy || 'Developer'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE CYCLE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-forest-deep">Create Monitoring Cycle</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-bold text-danger">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCycleSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700">Project *</label>
                <select
                  value={modalProjectId}
                  onChange={(e) => setModalProjectId(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-xs"
                >
                  <option value="">Select a project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.projectCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-stone-700">Cycle Name *</label>
                  <input
                    type="text"
                    value={createForm.cycleName}
                    onChange={(e) => setCreateForm({ ...createForm, cycleName: e.target.value })}
                    placeholder="e.g., Year 1 Monitoring Cycle"
                    required
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700">Cycle Code *</label>
                  <input
                    type="text"
                    value={createForm.cycleCode}
                    onChange={(e) => setCreateForm({ ...createForm, cycleCode: e.target.value })}
                    placeholder="e.g., MRV-Y1-2024"
                    required
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-stone-700">Start Date *</label>
                  <input
                    type="date"
                    value={createForm.monitoringStartDate}
                    onChange={(e) => setCreateForm({ ...createForm, monitoringStartDate: e.target.value })}
                    required
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700">End Date *</label>
                  <input
                    type="date"
                    value={createForm.monitoringEndDate}
                    onChange={(e) => setCreateForm({ ...createForm, monitoringEndDate: e.target.value })}
                    required
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700">Description & Monitoring Objectives</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Monitoring objectives, sampling framework, field team leads..."
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-xs"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createSubmitting}
                  className="rounded-lg border border-stone-300 px-3.5 py-2 text-xs font-bold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest-deep disabled:opacity-50"
                >
                  {createSubmitting ? 'Creating...' : 'Create Cycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
