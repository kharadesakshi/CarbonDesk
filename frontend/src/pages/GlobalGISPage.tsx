import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Map, ArrowRight, MapPin, CheckCircle2, AlertCircle, RefreshCw, Plus, Search } from 'lucide-react';
import { AppShell, PageHeader } from '../components/ui';
import { listProjects } from '../services/project.service';
import { Project } from '../types';

export function GlobalGISPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listProjects(search || undefined, undefined, undefined, 1, 50, 'updatedAt', 'DESC');
      setProjects(res.data || []);
    } catch (err: any) {
      console.error('Failed to load projects for GIS:', err);
      setError(err?.response?.data?.error || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  return (
    <AppShell>
      <PageHeader
        title="GIS & Geofencing Mapping"
        description="Select a carbon project to view, draw, and inspect project boundaries and calculate polygon areas."
        actions={
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder-stone-400 outline-none focus:border-forest"
          />
        </div>
        <p className="text-xs font-semibold text-stone-500">
          Showing <span className="font-bold text-forest">{projects.length}</span> projects
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-3 border-stone-200 border-t-forest" />
          <p className="text-sm font-medium text-stone-500">Loading projects for GIS mapping...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-xs">
          <Map size={36} className="mx-auto text-forest mb-3" />
          <h3 className="text-base font-bold text-forest-deep">No projects found</h3>
          <p className="mt-1 text-xs text-stone-600 max-w-sm mx-auto">
            Create a project first to map its geographical coordinates and polygon boundary.
          </p>
          <div className="mt-4">
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest-deep"
            >
              <Plus size={14} />
              <span>Create Project</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition hover:border-emerald-500/40 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    {p.projectType}
                  </span>
                  {p.hasGIS ? (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-success border border-emerald-200">
                      <CheckCircle2 size={12} />
                      GIS Configured
                    </span>
                  ) : (
                    <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-500">
                      No Boundary
                    </span>
                  )}
                </div>

                <h3 className="mt-1 text-lg font-bold text-forest-deep truncate" title={p.name}>
                  {p.name}
                </h3>
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  {p.projectCode || p.id}
                </p>

                <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-600 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-stone-400" />
                    <span className="truncate">
                      {[p.district || p.cityVillage, p.stateRegion, p.country].filter(Boolean).join(', ') || 'Global'}
                    </span>
                  </div>
                  {p.projectAreaHa ? (
                    <p className="text-stone-700">
                      Target Area: <strong>{p.projectAreaHa} Ha</strong>
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                <Link
                  to={`/projects/${p.id}`}
                  className="text-xs font-semibold text-stone-500 hover:text-forest"
                >
                  Overview
                </Link>
                <button
                  onClick={() => navigate(`/projects/${p.id}/gis`)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-forest-deep"
                >
                  <Map size={14} />
                  <span>Open GIS Map</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
