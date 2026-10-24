import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { AppShell, PageHeader } from '../components/ui';
import { projectSchema, ProjectFormData } from '../schemas/project.schema';
import { createProject } from '../services/project.service';

export function CreateProjectPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  async function onSubmit(data: ProjectFormData) {
    try {
      const project = await createProject(data);
      navigate(`/projects/${project.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Create New Project"
        description="Initialize a new carbon offset initiative and define core parameters."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl space-y-6" noValidate>
        {/* Basic Information */}
        <fieldset className="rounded border border-line bg-white p-5">
          <legend className="px-1 font-bold text-forest">1. Project Information</legend>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-bold text-ink">
              Project Name *
              <input
                type="text"
                {...register('name')}
                className={`mt-2 w-full rounded border p-2.5 outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20 ${
                  errors.name ? 'border-danger bg-red-50' : 'border-stone-300'
                }`}
                placeholder="Project name"
              />
              {errors.name && <span className="mt-1 block text-xs text-danger">{errors.name.message}</span>}
            </label>

            <label className="block text-sm font-bold text-ink">
              Project Type *
              <select
                {...register('projectType')}
                className={`mt-2 w-full rounded border bg-white p-2.5 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 ${
                  errors.projectType ? 'border-danger bg-red-50' : 'border-stone-300'
                }`}
              >
                <option value="">Select type...</option>
                <option value="ARR">Afforestation / Reforestation</option>
                <option value="REDD+">REDD+</option>
                <option value="Blue Carbon">Blue Carbon</option>
                <option value="ALM">Agricultural Land Management</option>
              </select>
              {errors.projectType && (
                <span className="mt-1 block text-xs text-danger">{errors.projectType.message}</span>
              )}
            </label>

            <label className="block text-sm font-bold text-ink md:col-span-2">
              Description
              <textarea
                {...register('description')}
                className="mt-2 w-full rounded border border-stone-300 p-2.5 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                placeholder="Describe your project"
                rows={3}
              />
            </label>
          </div>
        </fieldset>

        {/* Location */}
        <fieldset className="rounded border border-line bg-white p-5">
          <legend className="px-1 font-bold text-forest">2. Location</legend>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-bold text-ink">
              Country
              <input
                type="text"
                {...register('country')}
                className="mt-2 w-full rounded border border-stone-300 p-2.5 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                placeholder="Country"
              />
            </label>
            <label className="block text-sm font-bold text-ink">
              State / Region
              <input
                type="text"
                {...register('stateRegion')}
                className="mt-2 w-full rounded border border-stone-300 p-2.5 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                placeholder="State or region"
              />
            </label>
            <label className="block text-sm font-bold text-ink">
              Latitude
              <input
                type="number"
                step="0.0001"
                {...register('latitude')}
                className="mt-2 w-full rounded border border-stone-300 p-2.5 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                placeholder="0.0000"
              />
            </label>
            <label className="block text-sm font-bold text-ink">
              Longitude
              <input
                type="number"
                step="0.0001"
                {...register('longitude')}
                className="mt-2 w-full rounded border border-stone-300 p-2.5 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                placeholder="0.0000"
              />
            </label>
            <label className="block text-sm font-bold text-ink md:col-span-2">
              Project Area (hectares)
              <input
                type="number"
                step="0.01"
                {...register('projectAreaHa')}
                className="mt-2 w-full rounded border border-stone-300 p-2.5 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                placeholder="Area in hectares"
              />
            </label>
          </div>
        </fieldset>

        {/* Timeline */}
        <fieldset className="rounded border border-line bg-white p-5">
          <legend className="px-1 font-bold text-forest">3. Timeline</legend>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-bold text-ink">
              Start Date
              <input
                type="date"
                {...register('startDate')}
                className="mt-2 w-full rounded border border-stone-300 p-2.5 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
              />
            </label>
            <label className="block text-sm font-bold text-ink">
              Expected Duration (years)
              <input
                type="number"
                min="1"
                {...register('expectedDurationYears')}
                className="mt-2 w-full rounded border border-stone-300 p-2.5 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                placeholder="Years"
              />
            </label>
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="rounded border border-stone-300 px-5 py-2 font-bold hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-success px-5 py-2 font-bold text-white hover:bg-success/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </AppShell>
  );
}
