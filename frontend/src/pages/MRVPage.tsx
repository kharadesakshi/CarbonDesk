import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { AppShell, PageHeader } from '../components/ui';
import { listMRVCycles, createMRVCycle, getMRVCycle, generateReport, getReport } from '../services/mrv.service';
import { getProject } from '../services/project.service';
import { MRVCycle } from '../types';

interface MRVCycleWithStats extends MRVCycle {
  stats?: {
    totalMeasurements: number;
    submittedMeasurements: number;
    validMeasurements: number;
    invalidMeasurements: number;
    completionPercentage: number;
    validationPercentage: number;
    participantsWithData: number;
  };
}

export function MRVPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [cycles, setCycles] = useState<MRVCycleWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    cycleName: '',
    cycleCode: '',
    monitoringStartDate: '',
    monitoringEndDate: '',
    description: '',
  });

  // Load project and MRV cycles
  useEffect(() => {
    async function load() {
      if (!projectId) return;
      try {
        const [proj, cyclesData] = await Promise.all([
          getProject(projectId),
          listMRVCycles(projectId),
        ]);
        setProject(proj);
        setCycles(cyclesData.data || []);
      } catch (err) {
        console.error('Failed to load MRV data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    if (new Date(formData.monitoringEndDate) <= new Date(formData.monitoringStartDate)) {
      return;
    }

    try {
      const newCycle = await createMRVCycle(projectId, formData);
      setCycles([newCycle, ...cycles]);
      setFormData({
        cycleName: '',
        cycleCode: '',
        monitoringStartDate: '',
        monitoringEndDate: '',
        description: '',
      });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create MRV cycle:', err);
    }
  };

  const handleGenerateReport = async (cycleId: string) => {
    try {
      await generateReport(cycleId);
      // Refresh cycle data
      const updated = await getMRVCycle(cycleId);
      if (updated) {
        setCycles((prev) => prev.map((c) => (c.id === cycleId ? updated : c)));
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-stone-300 border-t-forest" role="status" aria-label="Loading" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="MRV Management"
        description={`Monitor measurement, reporting & verification for ${project?.name || 'this project'}`}
        actions={
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded bg-forest px-4 py-2 font-bold text-white hover:bg-forest-deep"
          >
            <Plus className="mr-1 inline h-4" />
            New MRV Cycle
          </button>
        }
      />

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-6 rounded border border-line bg-white p-5">
          <h3 className="mb-4 text-lg font-bold text-forest-deep">Create MRV Cycle</h3>
          <form onSubmit={handleCreateCycle} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label htmlFor="cycleName" className="block text-sm font-bold text-stone-600">Cycle Name</label>
                <input
                  id="cycleName"
                  type="text"
                  value={formData.cycleName}
                  onChange={(e) => setFormData({ ...formData, cycleName: e.target.value })}
                  className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="cycleCode" className="block text-sm font-bold text-stone-600">Cycle Code</label>
                <input
                  id="cycleCode"
                  type="text"
                  value={formData.cycleCode}
                  onChange={(e) => setFormData({ ...formData, cycleCode: e.target.value })}
                  className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="monitoringStartDate" className="block text-sm font-bold text-stone-600">Start Date</label>
                <input
                  id="monitoringStartDate"
                  type="date"
                  value={formData.monitoringStartDate}
                  onChange={(e) => setFormData({ ...formData, monitoringStartDate: e.target.value })}
                  className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="monitoringEndDate" className="block text-sm font-bold text-stone-600">End Date</label>
                <input
                  id="monitoringEndDate"
                  type="date"
                  value={formData.monitoringEndDate}
                  onChange={(e) => setFormData({ ...formData, monitoringEndDate: e.target.value })}
                  className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-bold text-stone-600">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded bg-forest px-4 py-2 font-bold text-white hover:bg-forest-deep"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded border border-stone-300 px-4 py-2 font-bold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MRV Cycles List */}
      <div className="space-y-4">
        {cycles.length === 0 ? (
          <div className="rounded border border-dashed border-stone-300 bg-white p-10 text-center">
            <p className="text-stone-600">No MRV cycles yet. Create one to get started.</p>
          </div>
        ) : (
          cycles.map((cycle) => (
            <div
              key={cycle.id}
              className="rounded border border-line bg-white p-5 cursor-pointer hover:shadow-md transition"
              onClick={() => navigate(`/projects/${projectId}/mrv/${cycle.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-forest-deep">{cycle.cycleName}</h3>
                  <p className="text-sm text-stone-600">
                    Code: {cycle.cycleCode} | {cycle.monitoringStartDate} to {cycle.monitoringEndDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {cycle.status === 'verified' ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-warning" />
                  )}
                  <span className="inline-block rounded px-2 py-1 bg-emerald-50 text-success font-bold text-xs">
                    {cycle.status}
                  </span>
                </div>
              </div>

              {cycle.stats && (
                <div className="mt-4 grid gap-4 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs font-bold uppercase text-stone-500">Completion</dt>
                    <dd className="mt-1 text-2xl font-bold text-forest">
                      {cycle.stats.completionPercentage.toFixed(0)}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-stone-500">Validated</dt>
                    <dd className="mt-1 text-2xl font-bold text-forest">
                      {cycle.stats.validationPercentage.toFixed(0)}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-stone-500">Measurements</dt>
                    <dd className="mt-1 text-2xl font-bold">
                      {cycle.stats.submittedMeasurements}/{cycle.stats.totalMeasurements}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-stone-500">Participants</dt>
                    <dd className="mt-1 text-2xl font-bold">
                      {cycle.stats.participantsWithData}
                    </dd>
                  </div>
                </div>
              )}

              {(cycle.status === 'validated' || cycle.status === 'verified') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateReport(cycle.id);
                  }}
                  className="mt-4 rounded bg-forest px-3 py-1 text-sm font-bold text-white hover:bg-forest-deep"
                >
                  Generate Report
                </button>
              )}

              {/* Measurement & Report Buttons */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${projectId}/mrv/${cycle.id}/measurements`);
                  }}
                  className="flex-1 rounded bg-forest-light px-3 py-1 text-sm font-bold text-forest hover:bg-forest-light/80"
                >
                  Manage Measurements
                </button>
                {cycle.status === 'report_generated' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${projectId}/mrv/${cycle.id}/report`);
                    }}
                    className="flex-1 rounded bg-forest-light px-3 py-1 text-sm font-bold text-forest hover:bg-forest-light/80"
                  >
                    View Report
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
