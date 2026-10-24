import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '../components/ui';
import { getProject } from '../services/project.service';
import { Project } from '../types';

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await getProject(id);
        setProject(data);
      } catch (err) {
        console.error('Failed to load project:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-stone-300 border-t-forest" />
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell>
        <div className="rounded border border-dashed border-stone-300 bg-white p-10 text-center">
          <h2 className="text-2xl font-bold text-forest-deep">Project Not Found</h2>
          <button onClick={() => navigate('/projects')} className="mt-4 text-forest hover:underline">
            Back to Projects
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/projects')} className="p-2 hover:bg-stone-100 rounded">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-forest-deep">{project.name}</h1>
          <p className="text-sm text-stone-600">{project.projectCode || project.id}</p>
        </div>
      </div>

      {/* Tabs - Navigation Links */}
      <div className="mb-6 border-b border-stone-200">
        <div className="flex gap-6">
          {(['overview', 'participants', 'documents', 'gis', 'mrv'] as const).map((tab) => {
            const isOverview = tab === 'overview';
            const href = isOverview ? `/projects/${project.id}` : `/projects/${project.id}/${tab}`;
            
            return (
              <Link
                key={tab}
                to={href}
                className={`border-b-2 px-1 pb-3 text-sm font-bold transition ${
                  isOverview
                    ? 'border-forest text-forest'
                    : 'border-transparent text-stone-600 hover:text-forest'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Link>
            );

          })}
        </div>
      </div>

      {/* Overview Content */}
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded border border-line bg-white p-5">
            <h2 className="text-lg font-bold text-forest-deep">Project Information</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-bold text-stone-600">Description</dt>
                <dd className="mt-1">{project.description || 'N/A'}</dd>
              </div>
              <div>
                <dt className="font-bold text-stone-600">Project Type</dt>
                <dd className="mt-1">{project.projectType}</dd>
              </div>
              <div>
                <dt className="font-bold text-stone-600">Status</dt>
                <dd className="mt-1 inline-block rounded px-2 py-1 bg-emerald-50 text-success font-bold text-xs">
                  {project.status}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-stone-600">Location</dt>
                <dd className="mt-1">
                  {[project.cityVillage, project.district, project.country].filter(Boolean).join(', ') || 'N/A'}
                </dd>
              </div>
            </dl>
          </section>
          <section className="rounded border border-line bg-white p-5">
            <h2 className="text-lg font-bold text-forest-deep">Statistics</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase text-stone-500">Participants</dt>
                <dd className="mt-1 text-2xl font-bold text-forest">{project.participantCount}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-stone-500">Area (ha)</dt>
                <dd className="mt-1 text-2xl font-bold">{project.projectAreaHa || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-stone-500">GIS Mapped</dt>
                <dd className="mt-1">
                  <span className={project.hasGIS ? 'text-success font-bold' : 'text-stone-600'}>
                    {project.hasGIS ? '✓ Yes' : '✗ No'}
                  </span>
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
