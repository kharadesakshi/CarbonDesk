import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AppShell, PageHeader } from '../components/ui';
import { createParticipant } from '../services/participant.service';

export function CreateParticipantPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    participantType: 'Individual',
    status: 'active',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    setError(null);
    setLoading(true);

    try {
      await createParticipant(projectId, {
        fullName: formData.fullName,
        email: formData.email,
        participantType: formData.participantType,
        status: formData.status as 'active' | 'inactive',
      });

      // Success - redirect back to participants list
      navigate(`/projects/${projectId}/participants`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add participant';
      setError(message);
      console.error('Failed to add participant:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-3">
        <button 
          onClick={() => navigate(`/projects/${projectId}/participants`)} 
          className="p-2 hover:bg-stone-100 rounded"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold text-forest-deep">Add Participant</h1>
      </div>

      <div className="max-w-2xl rounded border border-line bg-white p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="rounded bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Full Name */}
          <label className="block">
            <span className="text-sm font-bold text-ink">Full Name *</span>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded border border-stone-300 p-3 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
              placeholder="e.g., John Doe"
            />
          </label>

          {/* Email */}
          <label className="block">
            <span className="text-sm font-bold text-ink">Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-2 w-full rounded border border-stone-300 p-3 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
              placeholder="e.g., john@example.com"
            />
          </label>

          {/* Participant Type */}
          <label className="block">
            <span className="text-sm font-bold text-ink">Participant Type *</span>
            <select
              name="participantType"
              value={formData.participantType}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded border border-stone-300 bg-white p-3 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
            >
              <option value="Individual">Individual</option>
              <option value="Organization">Organization</option>
              <option value="Government">Government</option>
              <option value="NGO">NGO</option>
              <option value="Community">Community Group</option>
              <option value="Other">Other</option>
            </select>
          </label>

          {/* Status */}
          <label className="block">
            <span className="text-sm font-bold text-ink">Status *</span>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded border border-stone-300 bg-white p-3 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-forest px-6 py-2 font-bold text-white hover:bg-forest-deep disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Participant'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/projects/${projectId}/participants`)}
              className="rounded border border-stone-300 px-6 py-2 font-bold text-stone-600 hover:bg-stone-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
