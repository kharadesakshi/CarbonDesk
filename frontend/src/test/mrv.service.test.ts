import { describe, it, expect, beforeEach, vi } from 'vitest';
import api from '../services/api';
import * as mrvService from '../services/mrv.service';

vi.mock('../services/api');

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockMRVCycle = {
  id: 'cycle-1',
  projectId: 'proj-1',
  cycleName: 'Q1 2024',
  cycleCode: 'MRV-Q1',
  monitoringStartDate: '2024-01-01',
  monitoringEndDate: '2024-03-31',
  description: 'First quarter',
  status: 'draft',
};

const mockMeasurement = {
  id: 'meas-1',
  mrvCycleId: 'cycle-1',
  measurementTypeId: 'type-1',
  value: 125.5,
  unit: 'tonnes',
  measurementDate: '2024-02-15',
  participantId: 'part-1',
  source: 'manual',
  dataCategory: 'baseline',
  notes: 'Test measurement',
  status: 'draft',
};

const mockMeasurementType = {
  id: 'type-1',
  measurementCode: 'MT-001',
  measurementName: 'CO2 Equivalent',
  category: 'GHG_EMISSIONS',
  unit: 'tonnes',
  description: 'Carbon dioxide equivalent',
  applicableFor: ['all'],
};

const mockReport = {
  id: 'report-1',
  mrvCycleId: 'cycle-1',
  projectId: 'proj-1',
  reportTitle: 'Q1 Report',
  reportCode: 'RPT-Q1',
  reportingPeriodStart: '2024-01-01',
  reportingPeriodEnd: '2024-03-31',
  totalMeasurementsCount: 10,
  validMeasurementsCount: 9,
  status: 'draft',
};

const mockVerification = {
  id: 'verif-1',
  reportId: 'report-1',
  verificationStatus: 'verified',
  verifierComments: 'All good',
  findings: 'No issues',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── MRV Cycle Tests ──────────────────────────────────────────────────────────

describe('MRV Service - MRV Cycles', () => {
  it('listMRVCycles calls correct endpoint', async () => {
    (api.get as any).mockResolvedValue({
      data: { data: [mockMRVCycle], pagination: {} },
    });

    const result = await mrvService.listMRVCycles('proj-1');

    expect(api.get).toHaveBeenCalledWith('/projects/proj-1/mrv', {
      params: { page: 1, limit: 50 },
    });
    expect(result.data).toEqual([mockMRVCycle]);
  });

  it('listMRVCycles with status filter', async () => {
    (api.get as any).mockResolvedValue({
      data: { data: [mockMRVCycle], pagination: {} },
    });

    await mrvService.listMRVCycles('proj-1', 'draft');

    expect(api.get).toHaveBeenCalledWith('/projects/proj-1/mrv', {
      params: { page: 1, limit: 50, status: 'draft' },
    });
  });

  it('listMRVCycles with custom pagination', async () => {
    (api.get as any).mockResolvedValue({
      data: { data: [mockMRVCycle], pagination: {} },
    });

    await mrvService.listMRVCycles('proj-1', undefined, 2, 25);

    expect(api.get).toHaveBeenCalledWith('/projects/proj-1/mrv', {
      params: { page: 2, limit: 25 },
    });
  });

  it('createMRVCycle calls correct endpoint', async () => {
    (api.post as any).mockResolvedValue({
      data: { data: mockMRVCycle },
    });

    const payload = {
      cycleName: 'Q1 2024',
      cycleCode: 'MRV-Q1',
      monitoringStartDate: '2024-01-01',
      monitoringEndDate: '2024-03-31',
    };

    const result = await mrvService.createMRVCycle('proj-1', payload);

    expect(api.post).toHaveBeenCalledWith('/projects/proj-1/mrv', payload);
    expect(result.id).toBe('cycle-1');
  });

  it('getMRVCycle calls correct endpoint', async () => {
    (api.get as any).mockResolvedValue({
      data: { data: mockMRVCycle },
    });

    const result = await mrvService.getMRVCycle('cycle-1');

    expect(api.get).toHaveBeenCalledWith('/mrv/cycle-1');
    expect(result.cycleName).toBe('Q1 2024');
  });

  it('updateMRVCycle calls correct endpoint', async () => {
    const updated = { ...mockMRVCycle, cycleName: 'Q1 2024 Updated' };
    (api.put as any).mockResolvedValue({
      data: { data: updated },
    });

    const result = await mrvService.updateMRVCycle('cycle-1', {
      cycleName: 'Q1 2024 Updated',
    });

    expect(api.put).toHaveBeenCalledWith('/mrv/cycle-1', {
      cycleName: 'Q1 2024 Updated',
    });
    expect(result.cycleName).toBe('Q1 2024 Updated');
  });

  it('deleteMRVCycle calls correct endpoint', async () => {
    (api.delete as any).mockResolvedValue({});

    await mrvService.deleteMRVCycle('cycle-1');

    expect(api.delete).toHaveBeenCalledWith('/mrv/cycle-1');
  });
});

// ─── Measurement Type Tests ───────────────────────────────────────────────────

describe('MRV Service - Measurement Types', () => {
  it('listMeasurementTypes calls correct endpoint', async () => {
    (api.get as any).mockResolvedValue({
      data: { data: [mockMeasurementType], pagination: {} },
    });

    const result = await mrvService.listMeasurementTypes();

    expect(api.get).toHaveBeenCalledWith('/measurement-types', {
      params: { page: 1, limit: 100 },
    });
    expect(result.data).toEqual([mockMeasurementType]);
  });

  it('listMeasurementTypes with category filter', async () => {
    (api.get as any).mockResolvedValue({
      data: { data: [mockMeasurementType], pagination: {} },
    });

    await mrvService.listMeasurementTypes('GHG_EMISSIONS');

    expect(api.get).toHaveBeenCalledWith('/measurement-types', {
      params: { page: 1, limit: 100, category: 'GHG_EMISSIONS' },
    });
  });

  it('getMeasurementType calls correct endpoint', async () => {
    (api.get as any).mockResolvedValue({
      data: { data: mockMeasurementType },
    });

    const result = await mrvService.getMeasurementType('type-1');

    expect(api.get).toHaveBeenCalledWith('/measurement-types/type-1');
    expect(result.measurementName).toBe('CO2 Equivalent');
  });
});

// ─── Measurement Tests ────────────────────────────────────────────────────────

describe('MRV Service - Measurements', () => {
  it('listMeasurements calls correct endpoint', async () => {
    (api.get as any).mockResolvedValue({
      data: { data: [mockMeasurement], pagination: {} },
    });

    const result = await mrvService.listMeasurements('cycle-1');

    expect(api.get).toHaveBeenCalledWith('/mrv/cycle-1/measurements', {
      params: { page: 1, limit: 100 },
    });
    expect(result.data).toEqual([mockMeasurement]);
  });

  it('listMeasurements with status filter', async () => {
    (api.get as any).mockResolvedValue({
      data: { data: [mockMeasurement], pagination: {} },
    });

    await mrvService.listMeasurements('cycle-1', 'valid');

    expect(api.get).toHaveBeenCalledWith('/mrv/cycle-1/measurements', {
      params: { page: 1, limit: 100, status: 'valid' },
    });
  });

  it('createMeasurement calls correct endpoint', async () => {
    (api.post as any).mockResolvedValue({
      data: { data: mockMeasurement },
    });

    const payload = {
      measurementTypeId: 'type-1',
      value: '125.5',
      unit: 'tonnes',
      measurementDate: '2024-02-15',
      source: 'manual' as const,
      dataCategory: 'baseline' as const,
    };

    const result = await mrvService.createMeasurement(
      'proj-1',
      'cycle-1',
      payload
    );

    expect(api.post).toHaveBeenCalledWith(
      '/projects/proj-1/mrv/cycle-1/measurements',
      payload
    );
    expect(result.id).toBe('meas-1');
  });

  it('getMeasurement calls correct endpoint', async () => {
    (api.get as any).mockResolvedValue({
      data: { data: mockMeasurement },
    });

    const result = await mrvService.getMeasurement('meas-1');

    expect(api.get).toHaveBeenCalledWith('/measurements/meas-1');
    expect(result.value).toBe(125.5);
  });

  it('updateMeasurement calls correct endpoint', async () => {
    const updated = { ...mockMeasurement, value: 150.0 };
    (api.put as any).mockResolvedValue({
      data: { data: updated },
    });

    const result = await mrvService.updateMeasurement('meas-1', {
      value: '150.0',
    });

    expect(api.put).toHaveBeenCalledWith('/measurements/meas-1', {
      value: '150.0',
    });
    expect(result.value).toBe(150.0);
  });

  it('deleteMeasurement calls correct endpoint', async () => {
    (api.delete as any).mockResolvedValue({});

    await mrvService.deleteMeasurement('meas-1');

    expect(api.delete).toHaveBeenCalledWith('/measurements/meas-1');
  });

  it('submitMeasurement calls correct endpoint', async () => {
    const submitted = { ...mockMeasurement, status: 'submitted' };
    (api.post as any).mockResolvedValue({
      data: { data: submitted },
    });

    const result = await mrvService.submitMeasurement('meas-1');

    expect(api.post).toHaveBeenCalledWith('/measurements/meas-1/submit', {});
    expect(result.status).toBe('submitted');
  });

  it('submitMeasurement with notes', async () => {
    const submitted = { ...mockMeasurement, status: 'submitted' };
    (api.post as any).mockResolvedValue({
      data: { data: submitted },
    });

    await mrvService.submitMeasurement('meas-1', {
      notes: 'Submitting for review',
    });

    expect(api.post).toHaveBeenCalledWith('/measurements/meas-1/submit', {
      notes: 'Submitting for review',
    });
  });

  it('validateMeasurement with valid status', async () => {
    const validated = { ...mockMeasurement, status: 'valid' };
    (api.post as any).mockResolvedValue({
      data: { data: validated },
    });

    const result = await mrvService.validateMeasurement('meas-1', {
      status: 'valid',
      validationNotes: 'Looks good',
    });

    expect(api.post).toHaveBeenCalledWith('/measurements/meas-1/validate', {
      status: 'valid',
      validationNotes: 'Looks good',
    });
    expect(result.status).toBe('valid');
  });

  it('validateMeasurement with invalid status', async () => {
    const invalid = { ...mockMeasurement, status: 'invalid' };
    (api.post as any).mockResolvedValue({
      data: { data: invalid },
    });

    const result = await mrvService.validateMeasurement('meas-1', {
      status: 'invalid',
      validationNotes: 'Out of range',
    });

    expect(result.status).toBe('invalid');
  });
});

// ─── Report Tests ─────────────────────────────────────────────────────────────

describe('MRV Service - Reports', () => {
  it('generateReport calls correct endpoint', async () => {
    (api.post as any).mockResolvedValue({
      data: { data: mockReport },
    });

    const result = await mrvService.generateReport('cycle-1');

    expect(api.post).toHaveBeenCalledWith('/mrv/cycle-1/report/generate', {});
    expect(result.reportCode).toBe('RPT-Q1');
  });

  it('getReport calls correct endpoint', async () => {
    (api.get as any).mockResolvedValue({
      data: { data: mockReport },
    });

    const result = await mrvService.getReport('report-1');

    expect(api.get).toHaveBeenCalledWith('/reports/report-1');
    expect(result.reportTitle).toBe('Q1 Report');
  });

  it('submitReport calls correct endpoint', async () => {
    const submitted = { ...mockReport, status: 'submitted' };
    (api.post as any).mockResolvedValue({
      data: { data: submitted },
    });

    const result = await mrvService.submitReport('report-1');

    expect(api.post).toHaveBeenCalledWith('/reports/report-1/submit', {});
    expect(result.status).toBe('submitted');
  });
});

// ─── Verification Tests ───────────────────────────────────────────────────────

describe('MRV Service - Verification', () => {
  it('recordVerification with verified status', async () => {
    (api.post as any).mockResolvedValue({
      data: { data: mockVerification },
    });

    const result = await mrvService.recordVerification('report-1', {
      status: 'verified',
      comments: 'All good',
      findings: 'No issues',
    });

    expect(api.post).toHaveBeenCalledWith('/reports/report-1/verify', {
      status: 'verified',
      comments: 'All good',
      findings: 'No issues',
    });
    expect(result.verificationStatus).toBe('verified');
  });

  it('recordVerification with rejected status', async () => {
    const rejected = {
      ...mockVerification,
      verificationStatus: 'rejected',
      verifierComments: 'Data quality issues',
    };
    (api.post as any).mockResolvedValue({
      data: { data: rejected },
    });

    const result = await mrvService.recordVerification('report-1', {
      status: 'rejected',
      comments: 'Data quality issues',
    });

    expect(result.verificationStatus).toBe('rejected');
  });

  it('recordVerification with requires_changes status', async () => {
    const changes = {
      ...mockVerification,
      verificationStatus: 'requires_changes',
      verifierComments: 'Please review baseline data',
    };
    (api.post as any).mockResolvedValue({
      data: { data: changes },
    });

    const result = await mrvService.recordVerification('report-1', {
      status: 'requires_changes',
      comments: 'Please review baseline data',
    });

    expect(result.verificationStatus).toBe('requires_changes');
  });
});

// ─── Error Handling Tests ─────────────────────────────────────────────────────

describe('MRV Service - Error Handling', () => {
  it('handles API errors gracefully', async () => {
    const error = new Error('API Error');
    (api.get as any).mockRejectedValue(error);

    try {
      await mrvService.listMRVCycles('proj-1');
      fail('Should have thrown an error');
    } catch (err) {
      expect(err).toBe(error);
    }
  });

  it('handles network errors', async () => {
    const error = new Error('Network Error');
    (api.post as any).mockRejectedValue(error);

    try {
      await mrvService.createMRVCycle('proj-1', {
        cycleName: 'Test',
        cycleCode: 'TEST',
        monitoringStartDate: '2024-01-01',
        monitoringEndDate: '2024-03-31',
      });
      fail('Should have thrown an error');
    } catch (err) {
      expect(err).toBe(error);
    }
  });
});

// ─── Pagination Tests ─────────────────────────────────────────────────────────

describe('MRV Service - Pagination', () => {
  it('includes pagination info in responses', async () => {
    const pagination = { total: 100, page: 1, limit: 50, totalPages: 2 };
    (api.get as any).mockResolvedValue({
      data: { data: [mockMRVCycle], pagination },
    });

    const result = await mrvService.listMRVCycles('proj-1');

    expect(result.pagination).toEqual(pagination);
  });

  it('supports custom page and limit', async () => {
    (api.get as any).mockResolvedValue({
      data: { data: [mockMRVCycle], pagination: {} },
    });

    await mrvService.listMeasurements('cycle-1', undefined, 3, 20);

    expect(api.get).toHaveBeenCalledWith('/mrv/cycle-1/measurements', {
      params: { page: 3, limit: 20 },
    });
  });
});
