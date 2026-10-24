import { Request, Response } from 'express';
import {
  createMRVCycleSchema,
  updateMRVCycleSchema,
  createMeasurementTypeSchema,
  createMeasurementSchema,
  updateMeasurementSchema,
  submitMeasurementSchema,
  validateMeasurementSchema,
  recordVerificationSchema,
  attachEvidenceSchema,
  transitionCycleSchema,
} from '../validators/mrv.validator';
import { MRVService } from '../services/mrv/MRVService';
import { MeasurementType, MRVCycle, Measurement, MRVReport, AuditLog, Project } from '../models';
import { AppError } from '../middleware/errorHandler';
import { DashboardService } from '../services/dashboard/DashboardService';

// ─── MRV Cycle Controllers ─────────────────────────────────────────────────────

export async function listMRVCycles(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const projectId = req.params.projectId as string;
  const { status, page = '1', limit = '50' } = req.query as Record<string, string>;

  // Verify project ownership
  const cycle = await MRVCycle.findOne({ where: { projectId } });
  if (cycle) {
    // If cycles exist, verify one to check ownership
    const verified = await MRVCycle.findOne({
      where: { projectId },
      include: [{ association: 'project', attributes: ['developerId'] }],
    });
    if ((verified as any)?.project?.developerId !== developerId) {
      throw new AppError('Access denied.', 403);
    }
  }

  const { cycles, total } = await MRVService.listMRVCycles(
    projectId,
    developerId,
    status,
    parseInt(page),
    parseInt(limit)
  );

  res.json({
    data: cycles,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
}

export async function createMRVCycle(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const projectId = req.params.projectId as string;
  const data = createMRVCycleSchema.parse(req.body);

  const cycle = await MRVService.createMRVCycle(projectId, developerId, data);

  // Invalidate dashboard cache
  DashboardService.invalidateForDeveloper(developerId);

  res.status(201).json({ message: 'MRV cycle created.', data: cycle });
}

export async function getMRVCycle(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const mrvCycleId = req.params.mrvCycleId as string;

  const cycle = await MRVService.getMRVCycleWithStats(mrvCycleId, developerId);

  res.json({ data: cycle });
}

export async function updateMRVCycle(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const mrvCycleId = req.params.mrvCycleId as string;
  const data = updateMRVCycleSchema.parse(req.body);

  const cycle = await MRVCycle.findByPk(mrvCycleId, {
    include: [{ association: 'project', attributes: ['developerId'] }],
  });

  if (!cycle) {
    throw new AppError('MRV cycle not found.', 404);
  }

  if ((cycle as any)?.project?.developerId !== developerId) {
    throw new AppError('Access denied.', 403);
  }

  const updateData: any = data;
  if (data.monitoringStartDate) {
    updateData.monitoringStartDate = new Date(data.monitoringStartDate);
  }
  if (data.monitoringEndDate) {
    updateData.monitoringEndDate = new Date(data.monitoringEndDate);
  }

  await cycle.update(updateData);

  res.json({ message: 'MRV cycle updated.', data: cycle });
}

export async function deleteMRVCycle(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const mrvCycleId = req.params.mrvCycleId as string;

  const cycle = await MRVCycle.findByPk(mrvCycleId, {
    include: [{ association: 'project', attributes: ['developerId'] }],
  });

  if (!cycle) {
    throw new AppError('MRV cycle not found.', 404);
  }

  if ((cycle as any)?.project?.developerId !== developerId) {
    throw new AppError('Access denied.', 403);
  }

  await cycle.destroy();

  res.json({ message: 'MRV cycle deleted.' });
}

// ─── Measurement Type Controllers ──────────────────────────────────────────────

export async function listMeasurementTypes(req: Request, res: Response): Promise<void> {
  const { category, page = '1', limit = '100' } = req.query as Record<string, string>;

  const where: any = {};
  if (category) where.category = category;

  const { count, rows } = await MeasurementType.findAndCountAll({
    where,
    order: [['name', 'ASC']],
    limit: Math.min(parseInt(limit), 500),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });

  res.json({
    data: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit)),
    },
  });
}

// Seed measurement types if they don't exist
export async function seedMeasurementTypes(req: Request, res: Response): Promise<void> {
  const defaultTypes = [
    {
      name: 'Carbon Dioxide Equivalent (CO2e)',
      unit: 'tonnes',
      category: 'GHG_EMISSIONS',
      description: 'Total greenhouse gas emissions expressed as CO2 equivalent',
    },
    {
      name: 'Methane (CH4)',
      unit: 'kg',
      category: 'GHG_EMISSIONS',
      description: 'Methane emissions from various sources',
    },
    {
      name: 'Nitrous Oxide (N2O)',
      unit: 'kg',
      category: 'GHG_EMISSIONS',
      description: 'Nitrous oxide emissions',
    },
    {
      name: 'Forest Area',
      unit: 'hectares',
      category: 'FOREST_DATA',
      description: 'Total area of forest in hectares',
    },
    {
      name: 'Tree Count',
      unit: 'count',
      category: 'FOREST_DATA',
      description: 'Number of trees planted or existing',
    },
    {
      name: 'Biomass',
      unit: 'tonnes',
      category: 'FOREST_DATA',
      description: 'Total biomass in forest area',
    },
    {
      name: 'Soil Carbon',
      unit: 'tonnes/hectare',
      category: 'SOIL_DATA',
      description: 'Carbon stored in soil',
    },
    {
      name: 'Fuel Consumption',
      unit: 'litres',
      category: 'ENERGY_DATA',
      description: 'Fuel consumed for project operations',
    },
    {
      name: 'Electricity Usage',
      unit: 'kWh',
      category: 'ENERGY_DATA',
      description: 'Electricity consumed in project',
    },
    {
      name: 'Renewable Energy Production',
      unit: 'kWh',
      category: 'ENERGY_DATA',
      description: 'Renewable energy produced by project',
    },
    {
      name: 'Water Usage',
      unit: 'litres',
      category: 'WATER_DATA',
      description: 'Water consumption in project',
    },
    {
      name: 'Biodiversity Index',
      unit: 'index',
      category: 'BIODIVERSITY',
      description: 'Measure of biodiversity in project area',
    },
  ];

  try {
    // Check if types already exist
    const count = await MeasurementType.count();
    if (count > 0) {
      res.json({
        message: `Measurement types already seeded (${count} types found)`,
        data: await MeasurementType.findAll({ order: [['name', 'ASC']] }),
      });
      return;
    }

    // Create all types
    const created = await MeasurementType.bulkCreate(defaultTypes);

    res.status(201).json({
      message: `Successfully seeded ${created.length} measurement types`,
      data: created,
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({
      error: 'Failed to seed measurement types',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function createMeasurementType(req: Request, res: Response): Promise<void> {
  const data = createMeasurementTypeSchema.parse(req.body);

  const existing = await MeasurementType.findOne({ where: { name: data.name } });
  if (existing) {
    throw new AppError('Measurement type with this name already exists.', 409);
  }

  const type = await MeasurementType.create(data);

  res.status(201).json({ message: 'Measurement type created.', data: type });
}

export async function getMeasurementType(req: Request, res: Response): Promise<void> {
  const typeId = req.params.typeId as string;

  const type = await MeasurementType.findByPk(typeId);

  if (!type) {
    throw new AppError('Measurement type not found.', 404);
  }

  res.json({ data: type });
}

// ─── Measurement Controllers ───────────────────────────────────────────────────

export async function listMeasurements(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const mrvCycleId = req.params.mrvCycleId as string;
  const { status, category, page = '1', limit = '100' } = req.query as Record<string, string>;

  // Verify access
  const cycle = await MRVCycle.findByPk(mrvCycleId, {
    include: [{ association: 'project', attributes: ['developerId'] }],
  });

  if (!cycle) {
    throw new AppError('MRV cycle not found.', 404);
  }

  if ((cycle as any)?.project?.developerId !== developerId) {
    throw new AppError('Access denied.', 403);
  }

  const { measurements, total } = await MRVService.listMeasurements(
    mrvCycleId,
    developerId,
    status,
    category,
    parseInt(page),
    parseInt(limit)
  );

  res.json({
    data: measurements,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
}

export async function createMeasurement(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const projectId = req.params.projectId as string;
  const mrvCycleId = req.params.mrvCycleId as string;
  const data = createMeasurementSchema.parse(req.body);

  const measurement = await MRVService.createMeasurement(projectId, mrvCycleId, developerId, data);

  res.status(201).json({ message: 'Measurement created.', data: measurement });
}

export async function getMeasurement(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const measurementId = req.params.measurementId as string;

  const measurement = await Measurement.findByPk(measurementId, {
    include: [
      { model: MeasurementType, as: 'measurementType' },
      {
        association: 'mrvCycle',
        include: [{ association: 'project', attributes: ['developerId'] }],
      },
    ],
  });

  if (!measurement) {
    throw new AppError('Measurement not found.', 404);
  }

  const cycle = (measurement as any)?.mrvCycle;
  if (cycle?.project?.developerId !== developerId) {
    throw new AppError('Access denied.', 403);
  }

  res.json({ data: measurement });
}

export async function updateMeasurement(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const measurementId = req.params.measurementId as string;
  const data = updateMeasurementSchema.parse(req.body);

  const measurement = await Measurement.findByPk(measurementId, {
    include: [
      {
        association: 'mrvCycle',
        include: [{ association: 'project', attributes: ['developerId'] }],
      },
    ],
  });

  if (!measurement) {
    throw new AppError('Measurement not found.', 404);
  }

  const cycle = (measurement as any)?.mrvCycle;
  if (cycle?.project?.developerId !== developerId) {
    throw new AppError('Access denied.', 403);
  }

  // Can only update if in draft status
  if (measurement.status !== 'draft') {
    throw new AppError('Can only update measurements in draft status.', 400);
  }

  const updateData: any = { ...data };
  if (data.measurementDate) {
    updateData.measurementDate = new Date(data.measurementDate);
  }

  await measurement.update(updateData);

  res.json({ message: 'Measurement updated.', data: measurement });
}

export async function deleteMeasurement(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const measurementId = req.params.measurementId as string;

  const measurement = await Measurement.findByPk(measurementId, {
    include: [
      {
        association: 'mrvCycle',
        include: [{ association: 'project', attributes: ['developerId'] }],
      },
    ],
  });

  if (!measurement) {
    throw new AppError('Measurement not found.', 404);
  }

  const cycle = (measurement as any)?.mrvCycle;
  if (cycle?.project?.developerId !== developerId) {
    throw new AppError('Access denied.', 403);
  }

  await measurement.destroy();

  res.json({ message: 'Measurement deleted.' });
}

export async function submitMeasurement(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const measurementId = req.params.measurementId as string;
  const { notes } = submitMeasurementSchema.parse(req.body);

  const measurement = await MRVService.submitMeasurement(measurementId, developerId, notes);

  res.json({ message: 'Measurement submitted.', data: measurement });
}

export async function validateMeasurement(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const measurementId = req.params.measurementId as string;
  const { status, validationNotes } = validateMeasurementSchema.parse(req.body);

  const measurement = await MRVService.validateMeasurement(
    measurementId,
    developerId,
    status,
    validationNotes
  );

  res.json({ message: 'Measurement validated.', data: measurement });
}

// ─── Report Controllers ────────────────────────────────────────────────────────

export async function generateReport(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const mrvCycleId = req.params.mrvCycleId as string;

  const report = await MRVService.generateReport(mrvCycleId, developerId);

  res.json({ message: 'Report generated.', data: report });
}

export async function getReport(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const reportId = req.params.reportId as string;

  const report = await MRVReport.findByPk(reportId, {
    include: [
      {
        association: 'mrvCycle',
        include: [{ association: 'project', attributes: ['developerId'] }],
      },
    ],
  });

  if (!report) {
    throw new AppError('Report not found.', 404);
  }

  const cycle = (report as any)?.mrvCycle;
  if (cycle?.project?.developerId !== developerId) {
    throw new AppError('Access denied.', 403);
  }

  res.json({ data: report });
}

export async function submitReport(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const reportId = req.params.reportId as string;

  const report = await MRVService.submitReport(reportId, developerId);

  res.json({ message: 'Report submitted for verification.', data: report });
}

// ─── Verification Controllers ──────────────────────────────────────────────────

export async function recordVerification(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const reportId = req.params.reportId as string;
  const { status, comments, findings } = recordVerificationSchema.parse(req.body);

  const verification = await MRVService.recordVerification(
    reportId,
    developerId,
    status,
    comments,
    findings
  );

  res.json({ message: 'Verification recorded.', data: verification });
}

// ─── MRV Dashboard Controller ──────────────────────────────────────────────────

export async function getMRVDashboardStats(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const projectId = req.query.projectId as string | undefined;

  const stats = await MRVService.getDashboardStats(developerId, projectId);
  res.json({ data: stats });
}

// ─── Cycle Transition Controller ───────────────────────────────────────────────

export async function transitionMRVCycle(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const mrvCycleId = req.params.mrvCycleId as string;
  const { targetStatus, notes } = transitionCycleSchema.parse(req.body);

  const cycle = await MRVService.transitionCycleStatus(mrvCycleId, developerId, targetStatus, notes || undefined);
  res.json({ message: 'Cycle status updated.', data: cycle });
}

// ─── Evidence Controllers ──────────────────────────────────────────────────────

export async function attachEvidence(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const mrvCycleId = req.params.mrvCycleId as string;
  const data = attachEvidenceSchema.parse(req.body);

  const evidence = await MRVService.attachEvidence(mrvCycleId, developerId, data);
  res.status(201).json({ message: 'Evidence attached successfully.', data: evidence });
}

export async function listEvidence(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const mrvCycleId = req.params.mrvCycleId as string;

  const evidence = await MRVService.listEvidence(mrvCycleId, developerId);
  res.json({ data: evidence });
}

export async function deleteEvidence(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const evidenceId = req.params.evidenceId as string;

  await MRVService.deleteEvidence(evidenceId, developerId);
  res.json({ message: 'Evidence removed.' });
}

// ─── Audit Log Controller ──────────────────────────────────────────────────────

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const projectId = req.query.projectId as string | undefined;
  const mrvCycleId = req.query.mrvCycleId as string | undefined;

  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (mrvCycleId) where.mrvCycleId = mrvCycleId;

  // Verify developer ownership if projectId specified
  if (projectId) {
    const project = await Project.findOne({ where: { id: projectId, developerId } });
    if (!project) {
      throw new AppError('Access denied.', 403);
    }
  }

  const logs = await AuditLog.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: 50,
  });

  res.json({ data: logs });
}

