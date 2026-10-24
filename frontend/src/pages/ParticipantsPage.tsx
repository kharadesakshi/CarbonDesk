import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { AppShell, PageHeader, IconButton, DataTable } from '../components/ui';
import { listParticipants, deleteParticipant } from '../services/participant.service';
import { Participant, PaginatedResponse } from '../types';

/**
 * Get projectId from either route params or ProjectContext
 * Used when component is embedded as a tab
 */
function useProjectId(): string {
  const params = useParams<{ projectId: string }>();
  let contextProjectId: string | undefined;
  
  try {
    // Try to use context if available
    const { useProject } = require('../contexts/ProjectContext');
    const context = useProject();
    contextProjectId = context.projectId;
  } catch {
    // Context not available, use route params
  }

  return contextProjectId || params.projectId || '';
}

export function ParticipantsPage() {
  const projectId = useProjectId();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!projectId) return;
      try {
        const data = await listParticipants(projectId, undefined, undefined, 1, 50);
        setParticipants(data.data);
      } catch (err) {
        console.error('Failed to load participants:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete participant "${name}"?`)) {
      try {
        await deleteParticipant(id);
        setParticipants(participants.filter(p => p.id !== id));
      } catch (err) {
        console.error('Failed to delete participant:', err);
      }
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-stone-300 border-t-forest" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Participant Management"
        description="Manage participants for this project."
        actions={
          <button
            onClick={() => navigate(`/projects/${projectId}/participants/new`)}
            className="rounded bg-forest px-4 py-2 font-bold text-white hover:bg-forest-deep"
          >
            <Plus className="mr-1 inline h-4" />
            Add Participant
          </button>
        }
      />

      {participants.length === 0 ? (
        <div className="rounded border border-dashed border-stone-300 bg-white p-10 text-center">
          <h2 className="text-2xl font-bold text-forest-deep">No Participants</h2>
          <p className="mt-2 text-stone-600">Add your first participant to get started.</p>
          <button
            onClick={() => navigate(`/projects/${projectId}/participants/new`)}
            className="mt-4 inline-block rounded bg-forest px-4 py-2 font-bold text-white hover:bg-forest-deep"
          >
            Add Participant
          </button>
        </div>
      ) : (
        <DataTable>
          <thead className="bg-muted text-xs uppercase text-stone-600">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Documents</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="p-3 font-bold">{p.fullName}</td>
                <td className="p-3 text-sm">{p.participantType}</td>
                <td className="p-3">
                  <span
                    className={`inline-block rounded px-2 py-1 text-xs font-bold ${
                      p.status === 'active'
                        ? 'bg-emerald-50 text-success'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="p-3">{p.documentCount || 0}</td>
                <td className="p-3">
                  <button onClick={() => handleDelete(p.id, p.fullName)} className="rounded p-2 hover:bg-red-50">
                    <Trash2 size={17} className="text-stone-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </AppShell>
  );
}

export default ParticipantsPage;
