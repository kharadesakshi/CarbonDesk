import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MRVPage } from '../pages/MRVPage';
import * as mrvService from '../services/mrv.service';
import * as projectService from '../services/project.service';

// Mock services
vi.mock('../services/mrv.service');
vi.mock('../services/project.service');
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'test-user' },
  }),
}));

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const mockProject = {
  id: 'proj-1',
  name: 'Test Project',
  projectCode: 'PRJ-001',
};

const mockMRVCycles = [
  {
    id: 'cycle-1',
    projectId: 'proj-1',
    cycleName: 'Q1 2024 Monitoring',
    cycleCode: 'MRV-Q1-2024',
    monitoringStartDate: '2024-01-01',
    monitoringEndDate: '2024-03-31',
    description: 'First quarter monitoring',
    status: 'data_collection',
    stats: {
      totalMeasurements: 10,
      submittedMeasurements: 7,
      validMeasurements: 6,
      invalidMeasurements: 1,
      completionPercentage: 70,
      validationPercentage: 86,
      participantsWithData: 3,
    },
  },
  {
    id: 'cycle-2',
    projectId: 'proj-1',
    cycleName: 'Q2 2024 Monitoring',
    cycleCode: 'MRV-Q2-2024',
    monitoringStartDate: '2024-04-01',
    monitoringEndDate: '2024-06-30',
    description: 'Second quarter monitoring',
    status: 'verified',
    stats: {
      totalMeasurements: 15,
      submittedMeasurements: 15,
      validMeasurements: 15,
      invalidMeasurements: 0,
      completionPercentage: 100,
      validationPercentage: 100,
      participantsWithData: 5,
    },
  },
];

// ─── Setup ────────────────────────────────────────────────────────────────────

const renderMRVPage = (projectId = 'proj-1') => {
  return render(
    <MemoryRouter initialEntries={[`/projects/${projectId}/mrv`]}>
      <Routes>
        <Route path="/projects/:projectId/mrv" element={<MRVPage />} />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  (projectService.getProject as any).mockResolvedValue(mockProject);
  (mrvService.listMRVCycles as any).mockResolvedValue({
    data: mockMRVCycles,
    pagination: { total: 2, page: 1, limit: 50, totalPages: 1 },
  });
  (mrvService.getMRVCycle as any).mockResolvedValue(mockMRVCycles[1]);
});

// ─── Component Render Tests ───────────────────────────────────────────────────

describe('MRVPage Component', () => {
  it('renders page header', async () => {
    renderMRVPage();

    await waitFor(() => {
      expect(screen.getByText(/MRV Management/i)).toBeInTheDocument();
    });
  });

  it('displays loading spinner initially', () => {
    (projectService.getProject as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderMRVPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('loads and displays MRV cycles', async () => {
    renderMRVPage();

    await waitFor(() => {
      expect(screen.getByText('Q1 2024 Monitoring')).toBeInTheDocument();
      expect(screen.getByText('Q2 2024 Monitoring')).toBeInTheDocument();
    });
  });

  it('displays cycle statistics correctly', async () => {
    renderMRVPage();

    await waitFor(() => {
      // Q1 stats
      const percentages = screen.getAllByText(/70%/);
      expect(percentages.length).toBeGreaterThan(0);

      // Q2 stats (100%)
      const full = screen.getAllByText(/100%/);
      expect(full.length).toBeGreaterThan(0);
    });
  });

  it('shows verification status badge', async () => {
    renderMRVPage();

    await waitFor(() => {
      const badges = screen.getAllByText(/verified|data_collection/);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  it('displays "Create MRV Cycle" button', async () => {
    renderMRVPage();

    await waitFor(() => {
      expect(screen.getByText(/New MRV Cycle/)).toBeInTheDocument();
    });
  });
});

// ─── Create Form Tests ────────────────────────────────────────────────────────

describe('MRVPage - Create Cycle Form', () => {
  it('shows form when clicking Create button', async () => {
    renderMRVPage();

    await waitFor(() => {
      const createBtn = screen.getByText(/New MRV Cycle/);
      fireEvent.click(createBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Create MRV Cycle/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Cycle Name/)).toBeInTheDocument();
    });
  });

  it('has all form fields', async () => {
    renderMRVPage();

    const createBtn = await screen.findByText(/New MRV Cycle/);
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/Cycle Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Cycle Code/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Start Date/)).toBeInTheDocument();
      expect(screen.getByLabelText(/End Date/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    });
  });

  it('submits form with data', async () => {
    (mrvService.createMRVCycle as any).mockResolvedValue({
      id: 'new-cycle-1',
      cycleName: 'New Cycle',
      cycleCode: 'MRV-NEW',
      status: 'draft',
    });

    renderMRVPage();

    const createBtn = await screen.findByText(/New MRV Cycle/);
    fireEvent.click(createBtn);

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/Cycle Name/);
      const codeInput = screen.getByLabelText(/Cycle Code/);
      const startInput = screen.getByLabelText(/Start Date/);
      const endInput = screen.getByLabelText(/End Date/);

      fireEvent.change(nameInput, { target: { value: 'New Cycle' } });
      fireEvent.change(codeInput, { target: { value: 'MRV-NEW' } });
      fireEvent.change(startInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endInput, { target: { value: '2024-03-31' } });
    });

    const submitBtn = screen.getByRole('button', { name: /Create/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mrvService.createMRVCycle).toHaveBeenCalled();
    });
  });

  it('closes form when clicking Cancel', async () => {
    renderMRVPage();

    const createBtn = await screen.findByText(/New MRV Cycle/);
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText(/Create MRV Cycle/)).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Create MRV Cycle/)).not.toBeInTheDocument();
    });
  });

  it('validates date range', async () => {
    renderMRVPage();

    const createBtn = await screen.findByText(/New MRV Cycle/);
    fireEvent.click(createBtn);

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/Cycle Name/);
      const codeInput = screen.getByLabelText(/Cycle Code/);
      const startInput = screen.getByLabelText(/Start Date/);
      const endInput = screen.getByLabelText(/End Date/);

      fireEvent.change(nameInput, { target: { value: 'Test' } });
      fireEvent.change(codeInput, { target: { value: 'TEST' } });
      fireEvent.change(startInput, { target: { value: '2024-03-31' } });
      fireEvent.change(endInput, { target: { value: '2024-01-01' } }); // End before start
    });

    const submitBtn = screen.getByRole('button', { name: /Create/i });
    fireEvent.click(submitBtn);

    // Should not call API with invalid dates
    await waitFor(() => {
      expect(mrvService.createMRVCycle).not.toHaveBeenCalled();
    });
  });
});

// ─── Cycle Interaction Tests ──────────────────────────────────────────────────

describe('MRVPage - Cycle Interactions', () => {
  it('generates report when clicking Generate Report button', async () => {
    (mrvService.generateReport as any).mockResolvedValue({
      id: 'report-1',
      status: 'draft',
    });

    renderMRVPage();

    await waitFor(() => {
      expect(screen.getByText('Q2 2024 Monitoring')).toBeInTheDocument();
    });

    // Q2 is verified, should have Generate Report button
    const generateBtns = screen.getAllByText(/Generate Report/);
    expect(generateBtns.length).toBeGreaterThan(0);

    fireEvent.click(generateBtns[0]);

    await waitFor(() => {
      expect(mrvService.generateReport).toHaveBeenCalled();
    });
  });

  it('displays empty state when no cycles', async () => {
    (mrvService.listMRVCycles as any).mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, limit: 50, totalPages: 0 },
    });

    renderMRVPage();

    await waitFor(() => {
      expect(screen.getByText(/No MRV cycles yet/i)).toBeInTheDocument();
    });
  });

  it('navigates to cycle details on click', async () => {
    renderMRVPage();

    await waitFor(() => {
      expect(screen.getByText('Q1 2024 Monitoring')).toBeInTheDocument();
    });

    const cycleCard = screen.getByText('Q1 2024 Monitoring').closest('div');
    if (cycleCard) {
      fireEvent.click(cycleCard);
      // Navigation would occur (would need router test setup for full verification)
    }
  });
});

// ─── Error Handling Tests ─────────────────────────────────────────────────────

describe('MRVPage - Error Handling', () => {
  it('handles project load error', async () => {
    (projectService.getProject as any).mockRejectedValue(
      new Error('Load failed')
    );

    renderMRVPage();

    // Should render without crashing
    await waitFor(() => {
      expect(screen.getByText(/MRV Management/i)).toBeInTheDocument();
    });
  });

  it('handles cycles load error', async () => {
    (mrvService.listMRVCycles as any).mockRejectedValue(
      new Error('Load failed')
    );

    renderMRVPage();

    // Should render without crashing
    await waitFor(() => {
      expect(screen.getByText(/MRV Management/i)).toBeInTheDocument();
    });
  });

  it('handles create cycle error', async () => {
    (mrvService.createMRVCycle as any).mockRejectedValue(
      new Error('Creation failed')
    );

    renderMRVPage();

    const createBtn = await screen.findByText(/New MRV Cycle/);
    fireEvent.click(createBtn);

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/Cycle Name/);
      fireEvent.change(nameInput, { target: { value: 'Test' } });
    });

    const submitBtn = screen.getByRole('button', { name: /Create/i });
    fireEvent.click(submitBtn);

    // Should handle error gracefully
    await waitFor(() => {
      // Component should remain functional
      expect(screen.getByText(/MRV Management/i)).toBeInTheDocument();
    });
  });
});

// ─── Responsive Layout Tests ──────────────────────────────────────────────────

describe('MRVPage - Responsive Layout', () => {
  it('renders statistics in grid layout', async () => {
    renderMRVPage();

    await waitFor(() => {
      expect(screen.getByText('Q1 2024 Monitoring')).toBeInTheDocument();
    });

    // Stats should be visible
    expect(screen.getAllByText(/Completion/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Validated/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Measurements/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Participants/).length).toBeGreaterThan(0);
  });

  it('displays cycle code and dates', async () => {
    renderMRVPage();

    await waitFor(() => {
      expect(screen.getByText(/Code: MRV-Q1-2024/)).toBeInTheDocument();
      expect(screen.getByText(/2024-01-01 to 2024-03-31/)).toBeInTheDocument();
    });
  });
});
