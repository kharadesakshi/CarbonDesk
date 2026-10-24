import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Download, Eye, Trash2 } from 'lucide-react';
import { AppShell, PageHeader, FilterBar, SearchField, DataTable, Pagination, IconButton, StatusBadge } from '../components/ui';
import { listProjects, deleteProject } from '../services/project.service';
import { Project, PaginatedResponse } from '../types';

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await listProjects(search || undefined, status || undefined, undefined, pagination.page, pagination.limit);
        setProjects(data.data);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [search, status, pagination.page]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete project "${name}"? This cannot be undone.`)) {
      try {
        await deleteProject(id);
        setProjects(projects.filter(p => p.id !== id));
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Project Portfolio"
        description="Manage and track your carbon projects."
        actions={
          <div className="flex gap-2">
            <button className="rounded border border-forest px-3 py-2 text-sm font-bold text-forest hover:bg-stone-50">
              <Download className="mr-1 inline h-4" />
              Export
            </button>
            <Link
              to="/projects/new"
              className="rounded bg-forest px-3 py-2 text-sm font-bold text-white hover:bg-forest-deep"
            >
              <Plus className="mr-1 inline h-4" />
              Create Project
            </Link>
          </div>
        }
      />

      <FilterBar>
        <SearchField placeholder="Search projects..." />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-stone-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="under_review">Under Review</option>
          <option value="validated">Validated</option>
        </select>
      </FilterBar>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-stone-300 border-t-forest" />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded border border-dashed border-stone-300 bg-white p-10 text-center">
          <h2 className="text-2xl font-bold text-forest-deep">No Projects Yet</h2>
          <p className="mt-2 text-stone-600">Create your first project to get started.</p>
          <Link
            to="/projects/new"
            className="mt-4 inline-block rounded bg-forest px-4 py-2 font-bold text-white hover:bg-forest-deep"
          >
            Create Project
          </Link>
        </div>
      ) : (
        <>
          <DataTable>
            <thead className="bg-muted text-xs uppercase text-stone-600">
              <tr>
                <th className="p-3 text-left">Project Name</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Participants</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="p-3">
                    <Link to={`/projects/${p.id}`} className="font-bold text-forest hover:underline">
                      {p.name}
                    </Link>
                    <div className="text-xs text-stone-500">{p.projectCode || 'N/A'}</div>
                  </td>
                  <td className="p-3">{p.projectType}</td>
                  <td className="p-3 text-sm text-stone-600">{p.country || 'N/A'}</td>
                  <td className="p-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="p-3">{p.participantCount}</td>
                  <td className="p-3 flex gap-1">
                    <Link to={`/projects/${p.id}`}>
                      <IconButton label={`View ${p.name}`}>
                        <Eye size={17} />
                      </IconButton>
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="rounded p-2 text-forest hover:bg-red-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          <Pagination total={pagination.total} label="projects" />
        </>
      )}
    </AppShell>
  );
}

export default ProjectsPage;
