import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Eye, RefreshCw, AlertCircle, FileText, MapPin, Users, CheckCircle2, FolderKanban } from 'lucide-react';
import { AppShell, PageHeader, MetricCard } from '../components/ui';
import { getDashboardStats, listProjects } from '../services/project.service';
import { DashboardStats, Project } from '../types';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, projectsData] = await Promise.all([
        getDashboardStats().catch((err) => {
          console.warn('Stats fetch warning:', err);
          return null;
        }),
        listProjects(undefined, undefined, undefined, 1, 5, 'updatedAt', 'DESC'),
      ]);

      if (statsData) {
        setStats(statsData);
      } else {
        // Fallback default calculation from projects if stats failed
        setStats({
          totalProjects: projectsData.pagination?.total || projectsData.data.length,
          activeProjects: projectsData.data.filter((p) => p.status === 'active').length,
          totalParticipants: projectsData.data.reduce((acc, p) => acc + (p.participantCount || 0), 0),
          gisEnabledProjects: projectsData.data.filter((p) => p.hasGIS).length,
          totalDocuments: 0,
        });
      }

      setRecentProjects(projectsData.data || []);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError(err?.response?.data?.error || err?.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (dateVal: Date | string | null | undefined) => {
    if (!dateVal) return 'N/A';
    try {
      return new Date(dateVal).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return String(dateVal);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'active') {
      return <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-success border border-emerald-200">Active</span>;
    }
    if (s === 'validated') {
      return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">Validated</span>;
    }
    if (s === 'under_review') {
      return <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-warning border border-amber-200">Under Review</span>;
    }
    if (s === 'archived') {
      return <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-600 border border-stone-200">Archived</span>;
    }
    return <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-700 border border-stone-200">{status || 'Draft'}</span>;
  };

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Your carbon project management overview and latest activities."
        actions={
          <div className="flex gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95 disabled:opacity-50"
              title="Refresh dashboard"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-forest' : 'text-stone-500'} />
              <span>Refresh</span>
            </button>
            <Link
              to="/projects/new"
              className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-forest-deep active:scale-95"
            >
              <Plus size={16} />
              <span>Create Project</span>
            </Link>
          </div>
        }
      />

      {/* Error State */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-danger flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle size={24} className="shrink-0 text-danger" />
            <div>
              <p className="font-bold text-sm">Dashboard Error</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-lg bg-danger px-4 py-2 text-xs font-bold text-white hover:bg-red-700 w-fit"
          >
            <RefreshCw size={14} />
            <span>Retry Loading</span>
          </button>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Projects"
          value={loading ? '—' : stats ? stats.totalProjects : 0}
        />
        <MetricCard
          label="Active Projects"
          value={loading ? '—' : stats ? stats.activeProjects : 0}
          tone="success"
        />
        <MetricCard
          label="Total Participants"
          value={loading ? '—' : stats ? stats.totalParticipants : 0}
        />
        <MetricCard
          label="Total Documents"
          value={loading ? '—' : stats ? (stats.totalDocuments ?? stats.gisEnabledProjects ?? 0) : 0}
          tone="success"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent Projects Section */}
        <section className="lg:col-span-2 rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-forest-deep">Recent Projects</h2>
              <p className="text-xs text-stone-500 mt-0.5">Most recently updated carbon projects</p>
            </div>
            <Link
              to="/projects"
              className="inline-flex items-center gap-1 text-sm font-bold text-forest transition hover:text-emerald-700 hover:underline"
            >
              <span>View All Projects</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-3 border-stone-200 border-t-forest" />
              <p className="text-sm font-medium text-stone-500">Loading recent projects...</p>
            </div>
          ) : recentProjects.length === 0 && !error ? (
            /* Empty State */
            <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/50 p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-forest mb-4">
                <FolderKanban size={28} />
              </div>
              <h3 className="text-base font-bold text-forest-deep">No projects yet</h3>
              <p className="mt-1 text-sm text-stone-600 max-w-sm mx-auto">
                No projects yet. Create your first carbon project to get started.
              </p>
              <div className="mt-5">
                <Link
                  to="/projects/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-forest-deep"
                >
                  <Plus size={16} />
                  <span>Create Project</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Recent Projects Table */
            <div className="overflow-x-auto rounded-lg border border-stone-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs font-bold uppercase tracking-wider text-stone-600 border-b border-stone-200">
                  <tr>
                    <th className="p-3.5">Project</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Updated</th>
                    <th className="p-3.5 text-center">Participants</th>
                    <th className="p-3.5 text-center">GIS</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recentProjects.map((p) => {
                    const location = [p.district || p.cityVillage, p.stateRegion, p.country]
                      .filter(Boolean)
                      .join(', ') || 'Not specified';

                    return (
                      <tr key={p.id} className="transition hover:bg-stone-50/80">
                        <td className="p-3.5">
                          <Link
                            to={`/projects/${p.id}`}
                            className="font-bold text-forest-deep hover:text-emerald-700 hover:underline block"
                          >
                            {p.name}
                          </Link>
                          {p.projectCode && (
                            <span className="text-[11px] font-mono text-stone-500">
                              {p.projectCode}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-stone-700 text-xs font-medium">
                          {p.projectType}
                        </td>
                        <td className="p-3.5 text-stone-600 text-xs truncate max-w-[140px]" title={location}>
                          {location}
                        </td>
                        <td className="p-3.5">
                          {getStatusBadge(p.status)}
                        </td>
                        <td className="p-3.5 text-xs text-stone-500 whitespace-nowrap">
                          {formatDate(p.updatedAt || p.createdAt)}
                        </td>
                        <td className="p-3.5 text-center font-semibold text-stone-700 text-xs">
                          {p.participantCount ?? 0}
                        </td>
                        <td className="p-3.5 text-center">
                          {p.hasGIS ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success">
                              <CheckCircle2 size={13} />
                              Ready
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-400">None</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <Link
                            to={`/projects/${p.id}`}
                            className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2.5 py-1.5 text-xs font-bold text-stone-700 transition hover:bg-forest hover:text-white"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Quick Actions & Workspace Shortcuts */}
        <div className="space-y-6">
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
            <h2 className="text-xl font-bold tracking-tight text-forest-deep">Quick Actions</h2>
            <p className="text-xs text-stone-500 mt-0.5">Common workspace workflows</p>
            <div className="mt-5 space-y-3">
              <Link
                to="/projects/new"
                className="flex items-center justify-between rounded-lg bg-forest px-4 py-3 font-bold text-white shadow-sm transition hover:bg-forest-deep active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <Plus size={18} />
                  <span>Create New Project</span>
                </div>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/projects"
                className="flex items-center justify-between rounded-lg border border-stone-300 bg-white px-4 py-3 font-bold text-forest transition hover:bg-stone-50"
              >
                <div className="flex items-center gap-3">
                  <FolderKanban size={18} className="text-forest" />
                  <span>View All Projects</span>
                </div>
                <ArrowRight size={16} className="text-stone-400" />
              </Link>
              <Link
                to="/documents"
                className="flex items-center justify-between rounded-lg border border-stone-300 bg-white px-4 py-3 font-bold text-forest transition hover:bg-stone-50"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-forest" />
                  <span>Document Vault</span>
                </div>
                <ArrowRight size={16} className="text-stone-400" />
              </Link>
              <Link
                to="/settings"
                className="flex items-center justify-between rounded-lg border border-stone-300 bg-white px-4 py-3 font-bold text-forest transition hover:bg-stone-50"
              >
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-forest" />
                  <span>Developer Profile</span>
                </div>
                <ArrowRight size={16} className="text-stone-400" />
              </Link>
            </div>
          </section>

          {/* Platform Status Card */}
          <section className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-forest-deep">Compliance & Security</h3>
                <p className="text-xs text-emerald-800">Verified carbon accounting workspace</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-stone-600">
              Manage multi-party participants, geofenced project boundaries, baseline and verification documents with verifiable audit trails.
            </p>
            <div className="mt-4 pt-3 border-t border-emerald-100/80 flex items-center justify-between text-xs font-semibold text-emerald-900">
              <span>MRV Standards Ready</span>
              <span className="text-emerald-700 font-bold">Verra / Gold Standard</span>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
