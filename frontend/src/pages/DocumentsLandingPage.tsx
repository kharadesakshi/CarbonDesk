import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  FolderKanban,
  Users,
  ArrowRight,
  RefreshCw,
  Plus,
  AlertCircle,
  Calendar,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { AppShell, PageHeader } from '../components/ui';
import { listProjects } from '../services/project.service';
import { Project } from '../types';

export function DocumentsLandingPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listProjects(search || undefined, undefined, undefined, 1, 50, 'updatedAt', 'DESC');
      setProjects(res.data || []);
    } catch (err: any) {
      console.error('Failed to load projects for documents:', err);
      setError(err?.response?.data?.error || 'Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [search]);

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-success border border-emerald-200">
          Active
        </span>
      );
    }
    if (s === 'validated') {
      return (
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
          Validated
        </span>
      );
    }
    if (s === 'under_review') {
      return (
        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-warning border border-amber-200">
          Under Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-700 border border-stone-200">
        {status || 'Draft'}
      </span>
    );
  };

  return (
    <AppShell>
      <PageHeader
        title="Document Management Vault"
        description="Select a carbon project to view, upload, and organize project-level and participant-level documents."
        actions={
          <div className="flex gap-2">
            <button
              onClick={loadProjects}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-forest' : 'text-stone-500'} />
              <span>Refresh</span>
            </button>
            <Link
              to="/projects/new"
              className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-forest-deep"
            >
              <Plus size={16} />
              <span>New Project</span>
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name, code, or country..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder-stone-400 shadow-xs outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20"
          />
        </div>
        <p className="text-xs font-semibold text-stone-500 self-end sm:self-center">
          Showing <span className="font-bold text-forest">{projects.length}</span> projects
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-danger flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={22} className="shrink-0" />
            <div>
              <p className="font-bold text-sm">Failed to load projects</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={loadProjects}
            className="rounded-lg bg-danger px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-forest" />
          <p className="text-sm font-medium text-stone-600">Loading project documents repository...</p>
        </div>
      ) : projects.length === 0 && !error ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-forest mb-4">
            <FileText size={32} />
          </div>
          <h2 className="text-xl font-bold text-forest-deep">No projects found</h2>
          <p className="mt-2 text-sm text-stone-600 max-w-md mx-auto">
            {search
              ? `No projects matched "${search}". Try clearing your search filter.`
              : 'You do not have any carbon projects yet. Create your first project to start uploading and managing documents.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {search && (
              <button
                onClick={() => setSearch('')}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-bold text-stone-700 hover:bg-stone-50"
              >
                Clear Search
              </button>
            )}
            <Link
              to="/projects/new"
              className="rounded-lg bg-forest px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-forest-deep"
            >
              Create Project
            </Link>
          </div>
        </div>
      ) : (
        /* Projects List Grid / Cards */
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const location = [project.district || project.cityVillage, project.stateRegion, project.country]
              .filter(Boolean)
              .join(', ') || 'Location not specified';

            return (
              <div
                key={project.id}
                className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition hover:border-emerald-500/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        {project.projectType}
                      </span>
                      <h3 className="truncate text-lg font-bold text-forest-deep mt-0.5" title={project.name}>
                        {project.name}
                      </h3>
                      {project.projectCode && (
                        <p className="text-xs font-mono text-stone-500 mt-0.5">
                          {project.projectCode}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(project.status)}
                  </div>

                  <div className="mt-4 space-y-2 border-t border-stone-100 pt-3 text-xs text-stone-600">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="shrink-0 text-stone-400" />
                      <span className="truncate" title={location}>
                        {location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="shrink-0 text-stone-400" />
                      <span>
                        <strong className="text-stone-800">{project.participantCount ?? 0}</strong> registered participants
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                  <Link
                    to={`/projects/${project.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-forest hover:underline"
                  >
                    <span>Project Overview</span>
                    <ExternalLink size={12} />
                  </Link>

                  <button
                    onClick={() => navigate(`/documents/projects/${project.id}`)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-forest-deep active:scale-95"
                  >
                    <FileText size={14} />
                    <span>View Documents</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
