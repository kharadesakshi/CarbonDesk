import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { AppShell, PageHeader } from '../components/ui';
import {
  createMeasurement,
  listMeasurementTypes,
  listMeasurements,
  updateMeasurement,
  deleteMeasurement,
  submitMeasurement,
  validateMeasurement,
  getMRVCycle,
} from '../services/mrv.service';
import { listParticipants } from '../services/participant.service';
import { listProjectDocuments } from '../services/document.service';
import { createMeasurementSchema, updateMeasurementSchema, validateMeasurementSchema } from '../schemas/mrv.schema';
import { MRVCycle, Measurement, MeasurementType, Participant, Document } from '../types';

export function MeasurementFormPage() {
  const { projectId, cycleId } = useParams<{ projectId: string; cycleId: string }>();
  const navigate = useNavigate();

  const [cycle, setCycle] = useState<MRVCycle | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [types, setTypes] = useState<MeasurementType[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [projectDocs, setProjectDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    measurementTypeId: '',
    value: '',
    unit: '',
    measurementDate: '',
    participantId: '',
    source: 'manual' as const,
    dataCategory: 'baseline' as const,
    locationCoordinates: '',
    plotReference: '',
    documentId: '',
    evidenceType: 'field_observation',
    notes: '',
  });

  // Load data
  useEffect(() => {
    async function load() {
      if (!projectId || !cycleId) return;
      try {
        const [cycleData, measData, typesData, partsData, docsData] = await Promise.all([
          getMRVCycle(cycleId),
          listMeasurements(cycleId),
          listMeasurementTypes(),
          listParticipants(projectId).catch(() => ({ data: [] })),
          listProjectDocuments(projectId).catch(() => []),
        ]);

        setCycle(cycleData);
        setMeasurements(measData.data || []);
        setTypes(typesData.data || []);
        setParticipants(partsData.data || []);
        setProjectDocs(docsData || []);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId, cycleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !cycleId) return;

    try {
      // Convert empty strings to null for optional fields
      const normalizedData = {
        ...formData,
        participantId: formData.participantId || null,
        notes: formData.notes || null,
      };

      // Validate
      const schema = editingId ? updateMeasurementSchema : createMeasurementSchema;
      const validated = schema.parse(normalizedData);

      if (editingId) {
        const updated = await updateMeasurement(editingId, validated);
        setMeasurements(measurements.map((m) => (m.id === editingId ? updated : m)));
      } else {
        const created = await createMeasurement(projectId, cycleId, validated);
        setMeasurements([created, ...measurements]);
      }

      resetForm();
    } catch (err) {
      console.error('Validation error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this measurement?')) return;

    try {
      await deleteMeasurement(id);
      setMeasurements(measurements.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleSubmitForValidation = async (id: string) => {
    try {
      const updated = await submitMeasurement(id);
      setMeasurements(measurements.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      console.error('Failed to submit:', err);
    }
  };

  const handleValidate = async (id: string, status: 'valid' | 'invalid' | 'needs_correction') => {
    const notes = prompt('Validation notes:');
    if (notes === null) return;

    try {
      const schema = validateMeasurementSchema;
      const validated = schema.parse({
        status,
        validationNotes: notes,
      });

      const updated = await validateMeasurement(id, validated);
      setMeasurements(measurements.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      console.error('Failed to validate:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      measurementTypeId: '',
      value: '',
      unit: '',
      measurementDate: '',
      participantId: '',
      source: 'manual',
      dataCategory: 'baseline',
      locationCoordinates: '',
      plotReference: '',
      documentId: '',
      evidenceType: 'field_observation',
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (measurement: Measurement) => {
    setFormData({
      measurementTypeId: measurement.measurementTypeId,
      value: measurement.value.toString(),
      unit: measurement.unit,
      measurementDate: measurement.measurementDate.toString().split('T')[0],
      participantId: measurement.participantId || '',
      source: measurement.source,
      dataCategory: measurement.dataCategory,
      locationCoordinates: measurement.locationCoordinates || '',
      plotReference: measurement.plotReference || '',
      documentId: '',
      evidenceType: 'field_observation',
      notes: measurement.notes || '',
    });
    setEditingId(measurement.id);
    setShowForm(true);
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

  const selectedType = types.find((t) => t.id === formData.measurementTypeId);

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(`/projects/${projectId}/mrv/${cycleId}`)} className="p-2 hover:bg-stone-100 rounded" title="Back to Cycle Details">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-forest-deep">Measurements</h1>
          <p className="text-sm text-stone-600">{cycle?.cycleName}</p>
        </div>
      </div>

      {/* Create Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-forest px-4 py-2 font-bold text-white hover:bg-forest-deep"
        >
          <Plus className="mr-1 inline h-4" />
          New Measurement
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="mb-6 rounded border border-line bg-white p-5">
          <h3 className="mb-4 text-lg font-bold text-forest-deep">
            {editingId ? 'Edit Measurement' : 'Create Measurement'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Measurement Type */}
              <div>
                <label className="block text-sm font-bold text-stone-600">Measurement Type *</label>
                <select
                  value={formData.measurementTypeId}
                  onChange={(e) => {
                    const typeId = e.target.value;
                    const type = types.find((t) => t.id === typeId);
                    setFormData({
                      ...formData,
                      measurementTypeId: typeId,
                      unit: type?.unit || '',
                    });
                  }}
                  className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                  required
                >
                  <option value="">Select type...</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="block text-sm font-bold text-stone-600">Value *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                  required
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-bold text-stone-600">Unit</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                  disabled={!!selectedType}
                />
              </div>

              {/* Measurement Date */}
              <div>
                <label className="block text-sm font-bold text-stone-600">Measurement Date *</label>
                <input
                  type="date"
                  value={formData.measurementDate}
                  onChange={(e) => setFormData({ ...formData, measurementDate: e.target.value })}
                  className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                  required
                />
              </div>

              {/* Participant */}
              <div>
                <label className="block text-sm font-bold text-stone-600">Participant</label>
                <select
                  value={formData.participantId}
                  onChange={(e) => setFormData({ ...formData, participantId: e.target.value })}
                  className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                >
                  <option value="">Optional</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-bold text-stone-600">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value as any })}
                  className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                >
                  <option value="manual">Manual Entry</option>
                  <option value="field_survey">Field Survey</option>
                  <option value="document">Document</option>
                  <option value="gis">GIS</option>
                  <option value="satellite">Satellite</option>
                  <option value="iot">IoT Sensor</option>
                  <option value="import">Imported</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Data Category */}
              <div>
                <label className="block text-sm font-bold text-stone-600">Data Category</label>
                <select
                  value={formData.dataCategory}
                  onChange={(e) => setFormData({ ...formData, dataCategory: e.target.value as any })}
                  className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                >
                  <option value="baseline">Baseline</option>
                  <option value="project">Project</option>
                  <option value="monitoring">Monitoring</option>
                </select>
              </div>

              {/* Location Coordinates (GPS) */}
              <div>
                <label className="block text-sm font-bold text-stone-600">Location Coordinates (GPS / Lat, Long)</label>
                <input
                  type="text"
                  placeholder="e.g., 28.6139, 77.2090"
                  value={formData.locationCoordinates}
                  onChange={(e) => setFormData({ ...formData, locationCoordinates: e.target.value })}
                  className="mt-1 w-full rounded border border-stone-300 px-3 py-2 font-mono text-sm"
                />
              </div>

              {/* Plot Reference */}
              <div>
                <label className="block text-sm font-bold text-stone-600">Plot / Parcel Reference</label>
                <input
                  type="text"
                  placeholder="e.g., Plot-B2, North Canopy Sector"
                  value={formData.plotReference}
                  onChange={(e) => setFormData({ ...formData, plotReference: e.target.value })}
                  className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
                />
              </div>

              {/* Document Vault Evidence Link */}
              {!editingId && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-stone-600">Attach Document from Vault (Optional)</label>
                    <select
                      value={formData.documentId}
                      onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                      className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
                    >
                      <option value="">No document attached</option>
                      {projectDocs.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.documentName} ({doc.documentType})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-600">Evidence Type</label>
                    <select
                      value={formData.evidenceType}
                      onChange={(e) => setFormData({ ...formData, evidenceType: e.target.value })}
                      className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
                    >
                      <option value="field_observation">Field Observation</option>
                      <option value="photo">Photograph</option>
                      <option value="satellite_imagery">Satellite Imagery</option>
                      <option value="lab_report">Lab Report</option>
                      <option value="gis_survey">GIS / GPS Survey</option>
                      <option value="monitoring_spreadsheet">Monitoring Spreadsheet</option>
                      <option value="third_party_audit">Audit Note</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold text-stone-600">Notes & Observation Summary</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded bg-forest px-4 py-2 font-bold text-white hover:bg-forest-deep"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded border border-stone-300 px-4 py-2 font-bold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Measurements List */}
      <div className="space-y-3">
        {measurements.length === 0 ? (
          <div className="rounded border border-dashed border-stone-300 bg-white p-10 text-center">
            <p className="text-stone-600">No measurements yet. Add one to get started.</p>
          </div>
        ) : (
          measurements.map((measurement) => {
            const type = types.find((t) => t.id === measurement.measurementTypeId);
            const participant = participants.find((p) => p.id === measurement.participantId);

            return (
              <div key={measurement.id} className="rounded border border-line bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-forest-deep">{type?.name || type?.measurementName || 'Measurement'}</h4>
                    <p className="text-sm text-stone-600">
                      {measurement.value} {measurement.unit} • {measurement.measurementDate}
                    </p>
                    {participant && <p className="text-xs text-stone-500">Participant: {participant.fullName}</p>}
                    {measurement.plotReference && <p className="text-xs text-forest font-mono">Plot: {measurement.plotReference}</p>}
                    {measurement.locationCoordinates && <p className="text-xs text-stone-500 font-mono">GPS: {measurement.locationCoordinates}</p>}
                    {measurement.notes && <p className="mt-2 text-sm italic text-stone-600">{measurement.notes}</p>}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-bold ${
                        measurement.status === 'valid'
                          ? 'bg-success bg-opacity-20 text-success'
                          : measurement.status === 'invalid'
                            ? 'bg-danger bg-opacity-20 text-danger'
                            : measurement.status === 'submitted'
                              ? 'bg-warning bg-opacity-20 text-warning'
                              : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {measurement.status}
                    </span>

                    <div className="flex gap-1">
                      {measurement.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleEdit(measurement)}
                            className="px-2 py-1 text-xs rounded border border-forest bg-forest bg-opacity-10 text-forest hover:bg-opacity-20"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(measurement.id)}
                            className="px-2 py-1 text-xs rounded border border-danger bg-danger bg-opacity-10 text-danger hover:bg-opacity-20"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleSubmitForValidation(measurement.id)}
                            className="px-2 py-1 text-xs rounded border border-forest bg-forest text-white hover:bg-forest-deep"
                          >
                            Submit
                          </button>
                        </>
                      )}

                      {measurement.status === 'submitted' && (
                        <>
                          <button
                            onClick={() => handleValidate(measurement.id, 'valid')}
                            className="px-2 py-1 text-xs rounded border border-success bg-success bg-opacity-10 text-success hover:bg-opacity-20"
                          >
                            Validate ✓
                          </button>
                          <button
                            onClick={() => handleValidate(measurement.id, 'invalid')}
                            className="px-2 py-1 text-xs rounded border border-danger bg-danger bg-opacity-10 text-danger hover:bg-opacity-20"
                          >
                            Reject ✗
                          </button>
                          <button
                            onClick={() => handleValidate(measurement.id, 'needs_correction')}
                            className="px-2 py-1 text-xs rounded border border-warning bg-warning bg-opacity-10 text-warning hover:bg-opacity-20"
                          >
                            Needs Edit
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {measurement.validationNotes && (
                  <div className="mt-2 rounded bg-stone-100 p-2 text-sm text-stone-600">
                    <strong>Validation:</strong> {measurement.validationNotes}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
