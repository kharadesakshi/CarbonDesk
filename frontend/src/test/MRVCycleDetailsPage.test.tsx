import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MRVCycleDetailsPage } from '../pages/MRVCycleDetailsPage';
import * as mrvService from '../services/mrv.service';
import * as projectService from '../services/project.service';
import * as documentService from '../services/document.service';
import * as participantService from '../services/participant.service';

vi.mock('../services/mrv.service');
vi.mock('../services/project.service');
vi.mock('../services/document.service');
vi.mock('../services/participant.service');
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'test-user', fullName: 'Tester' },
  }),
}));

const mockProject = {
  id: 'proj-1',
  name: 'Kaveri Agroforestry Project',
  projectCode: 'KAV-01',
  projectType: 'ARR',
  country: 'India',
  stateRegion: 'Karnataka',
  gisData: { totalAreaHa: 1250 },
};

const mockCycle = {
  id: 'cycle-1',
  projectId: 'proj-1',
  cycleName: 'Annual Monitoring 2024',
  cycleCode: 'MRV-2024-A1',
  monitoringStartDate: '2024-01-01',
  monitoringEndDate: '2024-12-31',
  description: 'First comprehensive verification cycle',
  status: 'data_collection',
  stats: {
    totalMeasurements: 2,
    submittedMeasurements: 1,
    validMeasurements: 1,
    invalidMeasurements: 0,
    completionPercentage: 50,
    validationPercentage: 100,
    participantsWithData: 1,
  },
  reports: [],
};

const mockMeasurements = [
  {
    id: 'meas-1',
    mrvCycleId: 'cycle-1',
    measurementTypeId: 'type-1',
    value: 125.5,
    unit: 'tCO2e',
    measurementDate: '2024-06-15',
    participantId: 'part-1',
    source: 'field_survey',
    dataCategory: 'monitoring',
    locationCoordinates: '12.9716, 77.5946',
    plotReference: 'Plot-North-1',
    notes: 'Soil carbon core sample',
    status: 'valid',
    validationNotes: 'Lab confirmed',
  },
  {
    id: 'meas-2',
    mrvCycleId: 'cycle-1',
    measurementTypeId: 'type-2',
    value: 450,
    unit: 'trees',
    measurementDate: '2024-07-20',
    participantId: null,
    source: 'satellite',
    dataCategory: 'project',
    locationCoordinates: null,
    plotReference: null,
    notes: 'Canopy count from drone',
    status: 'submitted',
    validationNotes: null,
  },
];

const mockTypes = [
  { id: 'type-1', name: 'Soil Organic Carbon', category: 'CARBON_STOCK', unit: 'tCO2e' },
  { id: 'type-2', name: 'Tree Biomass Census', category: 'BIOMASS', unit: 'trees' },
];

const mockParticipants = [
  { id: 'part-1', fullName: 'Ramesh Kumar', participantCode: 'PART-001' },
];

const mockEvidence = [
  {
    id: 'ev-1',
    projectId: 'proj-1',
    mrvCycleId: 'cycle-1',
    documentId: 'doc-1',
    evidenceType: 'field_observation',
    description: 'Field survey logbook scan',
    attachedAt: '2024-06-16',
    document: {
      id: 'doc-1',
      documentName: 'Survey_Log_2024.pdf',
      documentType: 'Field Observation',
    },
  },
];

const renderComponent = (projectId = 'proj-1', cycleId = 'cycle-1') => {
  return render(
    <MemoryRouter initialEntries={[`/projects/${projectId}/mrv/${cycleId}`]}>
      <Routes>
        <Route path="/projects/:projectId/mrv/:cycleId" element={<MRVCycleDetailsPage />} />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  (projectService.getProject as any).mockResolvedValue(mockProject);
  (mrvService.getMRVCycle as any).mockResolvedValue(mockCycle);
  (mrvService.listMeasurements as any).mockResolvedValue({ data: mockMeasurements });
  (mrvService.listMeasurementTypes as any).mockResolvedValue({ data: mockTypes });
  (participantService.listParticipants as any).mockResolvedValue({ data: mockParticipants });
  (mrvService.listEvidence as any).mockResolvedValue(mockEvidence);
  (documentService.listProjectDocuments as any).mockResolvedValue([
    { id: 'doc-1', documentName: 'Survey_Log_2024.pdf', documentType: 'Field Observation' },
  ]);
  (mrvService.listMRVAuditLogs as any).mockResolvedValue([
    { id: 'log-1', action: 'create_cycle', performedBy: 'Tester', timestamp: '2024-01-01' },
  ]);
});

describe('MRVCycleDetailsPage Component', () => {
  it('renders cycle header, code and dates', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('Annual Monitoring 2024').length).toBeGreaterThan(0);
      expect(screen.getByText('MRV-2024-A1')).toBeInTheDocument();
      expect(screen.getByText(/data collection/i)).toBeInTheDocument();
    });
  });

  it('renders measurement list and values', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('125.5')).toBeInTheDocument();
      expect(screen.getByText('tCO2e')).toBeInTheDocument();
      expect(screen.getByText('Plot: Plot-North-1')).toBeInTheDocument();
    });
  });

  it('switches between tabs (Evidence, GIS, Methodology, Audit)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('Annual Monitoring 2024').length).toBeGreaterThan(0);
    });

    // Switch to Evidence tab
    const evidenceTabBtn = screen.getByRole('button', { name: /Evidence & Documents/i });
    fireEvent.click(evidenceTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Survey_Log_2024.pdf')).toBeInTheDocument();
      expect(screen.getByText('Field survey logbook scan')).toBeInTheDocument();
    });

    // Switch to GIS tab
    const gisTabBtn = screen.getByRole('button', { name: /GIS & Plot/i });
    fireEvent.click(gisTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Spatial & GIS Project Context/i)).toBeInTheDocument();
      expect(screen.getByText(/WGS84 \/ EPSG:4326/i)).toBeInTheDocument();
    });

    // Switch to Methodology tab
    const methodTabBtn = screen.getByRole('button', { name: /Methodology & Calculations/i });
    fireEvent.click(methodTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Methodology & Certification Safety Disclosure/i)).toBeInTheDocument();
    });
  });

  it('allows opening transition modal and submitting status change', async () => {
    (mrvService.transitionMRVCycle as any).mockResolvedValue({
      ...mockCycle,
      status: 'data_submitted',
    });

    renderComponent();

    const transitionBtn = await screen.findByRole('button', { name: /Submit Cycle for Validation/i });
    fireEvent.click(transitionBtn);

    await waitFor(() => {
      expect(screen.getByText(/Confirm Status Transition/i)).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /Confirm Transition/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mrvService.transitionMRVCycle).toHaveBeenCalledWith('cycle-1', expect.objectContaining({
        targetStatus: 'data_submitted',
      }));
    });
  });
});
