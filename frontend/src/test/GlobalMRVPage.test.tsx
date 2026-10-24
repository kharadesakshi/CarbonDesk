import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GlobalMRVPage } from '../pages/GlobalMRVPage';
import * as mrvService from '../services/mrv.service';
import * as projectService from '../services/project.service';

vi.mock('../services/mrv.service');
vi.mock('../services/project.service');
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'test-user', fullName: 'Tester' },
  }),
}));

const mockProjects = [
  { id: 'proj-1', name: 'Kaveri Agroforestry', projectCode: 'KAV-01', status: 'Active' },
  { id: 'proj-2', name: 'Sundarbans Mangrove', projectCode: 'SUN-02', status: 'Active' },
];

const mockStats = {
  summary: {
    totalCycles: 5,
    draftCycles: 1,
    dataCollectionCycles: 2,
    underReviewCycles: 1,
    verifiedCycles: 1,
    rejectedCycles: 0,
    totalMeasurements: 28,
    validMeasurements: 24,
    totalEvidenceCount: 8,
    totalReports: 2,
  },
  cycles: [
    {
      id: 'cycle-1',
      projectId: 'proj-1',
      cycleName: 'Kaveri 2024 Monitoring',
      cycleCode: 'KAV-M24',
      status: 'data_collection',
      monitoringStartDate: '2024-01-01',
      monitoringEndDate: '2024-06-30',
      createdAt: '2024-01-01',
      project: { id: 'proj-1', name: 'Kaveri Agroforestry', projectCode: 'KAV-01' },
      stats: { totalMeasurements: 15, submittedMeasurements: 10, validationPercentage: 80, participantsWithData: 4 },
    },
    {
      id: 'cycle-2',
      projectId: 'proj-2',
      cycleName: 'Sundarbans Carbon Cycle',
      cycleCode: 'SUN-M24',
      status: 'under_verification',
      monitoringStartDate: '2024-02-01',
      monitoringEndDate: '2024-08-31',
      createdAt: '2024-02-01',
      project: { id: 'proj-2', name: 'Sundarbans Mangrove', projectCode: 'SUN-02' },
      stats: { totalMeasurements: 13, submittedMeasurements: 13, validationPercentage: 100, participantsWithData: 6 },
    },
  ],
  projectSummaries: [
    { projectId: 'proj-1', totalCycles: 3 },
    { projectId: 'proj-2', totalCycles: 2 },
  ],
  attentionItems: [
    { id: 'cycle-3', projectId: 'proj-1', cycleName: 'Cycle Needing Edits', status: 'needs_correction' },
  ],
  recentActivity: [
    { id: 'log-1', action: 'validate_measurement', performedBy: 'QA Lead', timestamp: '2024-06-15' },
  ],
};

const renderComponent = () => {
  return render(
    <MemoryRouter>
      <GlobalMRVPage />
    </MemoryRouter>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  (projectService.listProjects as any).mockResolvedValue({ data: mockProjects });
  (mrvService.getMRVDashboardStats as any).mockResolvedValue(mockStats);
});

describe('GlobalMRVPage (MRV Dashboard)', () => {
  it('renders MRV hub title and header', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/MRV Monitoring & Verification Hub/i)).toBeInTheDocument();
    });
  });

  it('displays real summary metrics (Total, Data Collection, Verified, Valid Measurements)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // total cycles
      expect(screen.getByText('24')).toBeInTheDocument(); // valid measurements
      expect(screen.getByText('8')).toBeInTheDocument(); // attached evidence
    });
  });

  it('renders active monitoring cycles in the table with project context', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Kaveri 2024 Monitoring')).toBeInTheDocument();
      expect(screen.getByText('Sundarbans Carbon Cycle')).toBeInTheDocument();
      expect(screen.getByText('KAV-M24')).toBeInTheDocument();
      expect(screen.getByText('SUN-M24')).toBeInTheDocument();
    });
  });

  it('displays attention items callout banner', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Items Requiring Immediate Attention/i)).toBeInTheDocument();
      expect(screen.getByText('Cycle Needing Edits')).toBeInTheDocument();
    });
  });

  it('filters cycles by search query', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Kaveri 2024 Monitoring')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search cycles or projects/i);
    fireEvent.change(searchInput, { target: { value: 'Sundarbans' } });

    await waitFor(() => {
      expect(screen.getByText('Sundarbans Carbon Cycle')).toBeInTheDocument();
      expect(screen.queryByText('Kaveri 2024 Monitoring')).not.toBeInTheDocument();
    });
  });

  it('shows projects monitoring summary in sidebar', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Monitoring By Project/i)).toBeInTheDocument();
      expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument();
    });
  });
});
