/**
 * MRV Service - Core business logic for Measurement, Reporting & Verification
 * 
 * Responsibilities:
 * - MRV cycle lifecycle management
 * - Measurement validation and status transitions
 * - Report generation and statistics
 * - Evidence attachment and Document Vault integration
 * - Data completeness calculations
 * - Audit logging and workflow state machines
 * - MRV Dashboard aggregation
 */

import {
  MRVCycle,
  Measurement,
  MRVReport,
  Verification,
  AuditLog,
  MeasurementType,
  Participant,
  Project,
  ProjectGIS,
  Document,
  MRVEvidence,
} from '../../models';
import { AppError } from '../../middleware/errorHandler';
import { Op } from 'sequelize';

export class MRVService {
  /**
   * Create new MRV cycle
   */
  static async createMRVCycle(
    projectId: string,
    developerId: string,
    data: {
      cycleName: string;
      cycleCode: string;
      monitoringStartDate: string;
      monitoringEndDate: string;
      description?: string | null;
    }
  ): Promise<MRVCycle> {
    // Verify project exists and is owned by developer
    const project = await Project.findOne({
      where: { id: projectId, developerId },
    });
    if (!project) {
      throw new AppError('Project not found or access denied.', 404);
    }

    // Check for duplicate cycle code
    const existing = await MRVCycle.findOne({
      where: { projectId, cycleCode: data.cycleCode },
    });
    if (existing) {
      throw new AppError('Cycle code must be unique within project.', 400);
    }

    const cycle = await MRVCycle.create({
      projectId,
      cycleName: data.cycleName,
      cycleCode: data.cycleCode,
      monitoringStartDate: new Date(data.monitoringStartDate),
      monitoringEndDate: new Date(data.monitoringEndDate),
      description: data.description || null,
      createdBy: developerId,
      status: 'draft',
    });

    // Log audit event
    await this.logAudit(developerId, projectId, cycle.id, 'mrv_cycle_created', 'MRVCycle', cycle.id, {
      cycleName: data.cycleName,
      cycleCode: data.cycleCode,
    });

    return cycle;
  }

  /**
   * Get MRV cycle with statistics, project GIS, evidence, and report info
   */
  static async getMRVCycleWithStats(cycleId: string, developerId: string): Promise<any> {
    const cycle = await MRVCycle.findByPk(cycleId, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: [
            'id',
            'developerId',
            'name',
            'projectCode',
            'projectType',
            'status',
            'country',
            'stateRegion',
            'district',
            'methodology',
            'hasGIS',
            'estimatedAnnualCO2Tonnes',
          ],
          include: [
            {
              model: ProjectGIS,
              as: 'gis',
              attributes: ['centerLatitude', 'centerLongitude', 'calculatedAreaHa', 'boundaryGeoJSON'],
            },
          ],
        },
        {
          model: MRVReport,
          as: 'reports',
          include: [
            {
              model: Verification,
              as: 'verifications',
            },
          ],
        },
        {
          model: MRVEvidence,
          as: 'evidence',
          include: [
            {
              model: Document,
              as: 'document',
              attributes: ['id', 'documentName', 'documentType', 'originalFileName', 'fileSizeBytes', 'mimeType', 'createdAt'],
            },
          ],
        },
      ],
    });

    if (!cycle) {
      throw new AppError('MRV cycle not found.', 404);
    }

    // Verify ownership
    const project = cycle.get('project') as any;
    if (project.developerId !== developerId) {
      throw new AppError('Access denied.', 403);
    }

    // Calculate statistics
    const stats = await this.calculateCycleStats(cycleId);

    // Fetch recent audit logs for this cycle
    const auditLogs = await AuditLog.findAll({
      where: { mrvCycleId: cycleId },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    return {
      ...cycle.toJSON(),
      stats,
      auditLogs,
    };
  }

  /**
   * Calculate completion and validation statistics for a cycle
   */
  static async calculateCycleStats(mrvCycleId: string): Promise<{
    totalMeasurements: number;
    submittedMeasurements: number;
    validMeasurements: number;
    invalidMeasurements: number;
    completionPercentage: number;
    validationPercentage: number;
    participantsWithData: number;
    totalEvidenceCount: number;
    measurementsByStatus: Record<string, number>;
  }> {
    const [measurements, totalEvidenceCount] = await Promise.all([
      Measurement.findAll({ where: { mrvCycleId } }),
      MRVEvidence.count({ where: { mrvCycleId } }),
    ]);

    const totalMeasurements = measurements.length;
    const submittedMeasurements = measurements.filter((m) => m.status !== 'draft').length;
    const validMeasurements = measurements.filter((m) => m.status === 'valid').length;
    const invalidMeasurements = measurements.filter((m) => m.status === 'invalid').length;

    const completionPercentage = totalMeasurements > 0 ? (submittedMeasurements / totalMeasurements) * 100 : 0;
    const validationPercentage = submittedMeasurements > 0 ? (validMeasurements / submittedMeasurements) * 100 : 0;

    // Count unique participants with measurements
    const participantIds = new Set(measurements.filter((m) => m.participantId).map((m) => m.participantId));
    const participantsWithData = participantIds.size;

    // Count by status
    const measurementsByStatus = {
      draft: measurements.filter((m) => m.status === 'draft').length,
      submitted: measurements.filter((m) => m.status === 'submitted').length,
      valid: validMeasurements,
      invalid: invalidMeasurements,
      needs_correction: measurements.filter((m) => m.status === 'needs_correction').length,
    };

    return {
      totalMeasurements,
      submittedMeasurements,
      validMeasurements,
      invalidMeasurements,
      completionPercentage,
      validationPercentage,
      participantsWithData,
      totalEvidenceCount,
      measurementsByStatus,
    };
  }

  /**
   * Transition cycle workflow state
   */
  static async transitionCycleStatus(
    mrvCycleId: string,
    developerId: string,
    targetStatus: string,
    notes?: string
  ): Promise<MRVCycle> {
    const cycle = await MRVCycle.findByPk(mrvCycleId, {
      include: [{ association: 'project', attributes: ['developerId'] }],
    });

    if (!cycle) {
      throw new AppError('MRV cycle not found.', 404);
    }

    const project = cycle.get('project') as any;
    if (project.developerId !== developerId) {
      throw new AppError('Access denied.', 403);
    }

    // Current status and allowed transitions
    const current = cycle.status;
    const allowedTransitions: Record<string, string[]> = {
      draft: ['data_collection'],
      data_collection: ['data_submitted', 'draft'],
      data_submitted: ['validation', 'data_collection'],
      validation: ['validated', 'needs_correction', 'data_collection'],
      needs_correction: ['data_collection'],
      validated: ['report_generated', 'submitted_for_verification', 'data_collection'],
      report_generated: ['submitted_for_verification', 'validated'],
      submitted_for_verification: ['under_verification', 'needs_correction'],
      under_verification: ['verified', 'rejected', 'needs_correction'],
      verified: [], // Locked once verified
      rejected: ['data_collection'],
    };

    if (current === targetStatus) {
      return cycle;
    }

    const allowed = allowedTransitions[current] || [];
    if (!allowed.includes(targetStatus)) {
      throw new AppError(
        `Invalid status transition from "${current}" to "${targetStatus}". Allowed transitions: ${allowed.join(', ') || 'None (Cycle is finalized)'}`,
        400
      );
    }

    // Require at least one measurement before submitting
    if (['data_submitted', 'submitted_for_verification'].includes(targetStatus)) {
      const count = await Measurement.count({ where: { mrvCycleId } });
      if (count === 0) {
        throw new AppError('Cannot submit monitoring cycle without recorded measurements.', 400);
      }
    }

    const updatePayload: any = { status: targetStatus };
    if (['data_submitted', 'submitted_for_verification'].includes(targetStatus)) {
      updatePayload.submittedAt = new Date();
    } else if (targetStatus === 'validated') {
      updatePayload.validatedAt = new Date();
    } else if (targetStatus === 'verified') {
      updatePayload.verifiedAt = new Date();
    }

    await cycle.update(updatePayload);

    await this.logAudit(
      developerId,
      cycle.projectId,
      cycle.id,
      targetStatus.includes('submit') ? 'mrv_cycle_submitted' : 'mrv_cycle_updated',
      'MRVCycle',
      cycle.id,
      { previousStatus: current, newStatus: targetStatus, notes: notes || null }
    );

    return cycle;
  }

  /**
   * Create measurement
   */
  static async createMeasurement(
    projectId: string,
    mrvCycleId: string,
    developerId: string,
    data: {
      measurementTypeId: string;
      value: number;
      unit: string;
      measurementDate: string;
      participantId?: string | null;
      source?: string;
      dataCategory?: string;
      locationCoordinates?: string | null;
      plotReference?: string | null;
      notes?: string | null;
      documentId?: string | null;
      evidenceType?: string | null;
    }
  ): Promise<Measurement> {
    // Verify project and cycle
    const cycle = await MRVCycle.findOne({
      where: { id: mrvCycleId, projectId },
      include: [{ model: Project, as: 'project', attributes: ['developerId'] }],
    });

    if (!cycle) {
      throw new AppError('MRV cycle not found.', 404);
    }

    const project = cycle.get('project') as any;
    if (project.developerId !== developerId) {
      throw new AppError('Access denied.', 403);
    }

    if (cycle.status === 'verified') {
      throw new AppError('Cannot add measurements to a verified monitoring cycle.', 400);
    }

    // Verify measurement type exists
    const measurementType = await MeasurementType.findByPk(data.measurementTypeId);
    if (!measurementType) {
      throw new AppError('Measurement type not found.', 404);
    }

    // Verify participant if specified
    if (data.participantId) {
      const participant = await Participant.findOne({
        where: { id: data.participantId, projectId },
      });
      if (!participant) {
        throw new AppError('Participant not found or does not belong to this project.', 404);
      }
    }

    const measurement = await Measurement.create({
      mrvCycleId,
      projectId,
      measurementTypeId: data.measurementTypeId,
      value: data.value,
      unit: data.unit,
      measurementDate: new Date(data.measurementDate),
      participantId: data.participantId || null,
      source: (data.source || 'manual') as any,
      dataCategory: (data.dataCategory || 'monitoring') as any,
      locationCoordinates: data.locationCoordinates || null,
      plotReference: data.plotReference || null,
      status: 'draft',
      notes: data.notes || null,
    });

    // If evidence document attached during creation
    if (data.documentId) {
      const doc = await Document.findOne({
        where: { id: data.documentId, projectId },
      });
      if (doc) {
        await MRVEvidence.create({
          projectId,
          mrvCycleId,
          measurementId: measurement.id,
          documentId: data.documentId,
          evidenceType: data.evidenceType || 'Field Observation',
          description: data.notes || null,
          uploadedById: developerId,
        });
      }
    }

    // If cycle was in draft, transition to data_collection
    if (cycle.status === 'draft') {
      await cycle.update({ status: 'data_collection' });
    }

    await this.logAudit(
      developerId,
      projectId,
      mrvCycleId,
      'measurement_created',
      'Measurement',
      measurement.id,
      { type: measurementType.name, value: data.value, unit: data.unit }
    );

    return measurement;
  }

  /**
   * Update measurement
   */
  static async updateMeasurement(
    measurementId: string,
    developerId: string,
    data: any
  ): Promise<Measurement> {
    const measurement = await Measurement.findByPk(measurementId, {
      include: [
        {
          model: MRVCycle,
          as: 'mrvCycle',
          include: [{ model: Project, as: 'project', attributes: ['developerId'] }],
        },
      ],
    });

    if (!measurement) {
      throw new AppError('Measurement not found.', 404);
    }

    const cycle = measurement.get('mrvCycle') as any;
    if (cycle.project.developerId !== developerId) {
      throw new AppError('Access denied.', 403);
    }

    if (cycle.status === 'verified') {
      throw new AppError('Cannot modify measurements in a verified cycle.', 400);
    }

    const updatePayload: any = { ...data };
    if (data.measurementDate) {
      updatePayload.measurementDate = new Date(data.measurementDate);
    }

    await measurement.update(updatePayload);

    await this.logAudit(
      developerId,
      measurement.projectId,
      measurement.mrvCycleId,
      'measurement_updated',
      'Measurement',
      measurementId
    );

    return measurement;
  }

  /**
   * Delete measurement
   */
  static async deleteMeasurement(measurementId: string, developerId: string): Promise<void> {
    const measurement = await Measurement.findByPk(measurementId, {
      include: [
        {
          model: MRVCycle,
          as: 'mrvCycle',
          include: [{ model: Project, as: 'project', attributes: ['developerId'] }],
        },
      ],
    });

    if (!measurement) {
      throw new AppError('Measurement not found.', 404);
    }

    const cycle = measurement.get('mrvCycle') as any;
    if (cycle.project.developerId !== developerId) {
      throw new AppError('Access denied.', 403);
    }

    if (cycle.status === 'verified') {
      throw new AppError('Cannot delete measurements from a verified cycle.', 400);
    }

    await measurement.destroy();
  }

  /**
   * Submit measurement for validation
   */
  static async submitMeasurement(
    measurementId: string,
    developerId: string,
    notes?: string | null
  ): Promise<Measurement> {
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

    const cycle = measurement.get('mrvCycle') as any;
    if (cycle.project.developerId !== developerId) {
      throw new AppError('Access denied.', 403);
    }

    // Validate measurement has required fields
    if (measurement.value === undefined || measurement.value === null || !measurement.measurementDate) {
      throw new AppError('Measurement missing required value or date.', 400);
    }

    await measurement.update({
      status: 'submitted',
      submittedAt: new Date(),
      notes: notes || measurement.notes,
    });

    // Log audit event
    await this.logAudit(
      developerId,
      measurement.projectId,
      measurement.mrvCycleId,
      'measurement_submitted',
      'Measurement',
      measurementId
    );

    return measurement;
  }

  /**
   * Validate / review measurement
   */
  static async validateMeasurement(
    measurementId: string,
    developerId: string,
    status: 'valid' | 'invalid' | 'needs_correction',
    validationNotes?: string | null
  ): Promise<Measurement> {
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

    const cycle = measurement.get('mrvCycle') as any;
    if (cycle.project.developerId !== developerId) {
      throw new AppError('Access denied.', 403);
    }

    await measurement.update({
      status,
      validatedAt: new Date(),
      validatedBy: developerId,
      validationNotes: validationNotes || null,
    });

    // Log audit event
    const action = status === 'valid' ? 'measurement_validated' : 'measurement_rejected';
    await this.logAudit(
      developerId,
      measurement.projectId,
      measurement.mrvCycleId,
      action as any,
      'Measurement',
      measurementId,
      { status, notes: validationNotes }
    );

    return measurement;
  }

  /**
   * Attach evidence to monitoring cycle or measurement
   */
  static async attachEvidence(
    mrvCycleId: string,
    developerId: string,
    data: {
      documentId: string;
      measurementId?: string | null;
      evidenceType: string;
      description?: string | null;
    }
  ): Promise<MRVEvidence> {
    const cycle = await MRVCycle.findByPk(mrvCycleId, {
      include: [{ model: Project, as: 'project', attributes: ['id', 'developerId'] }],
    });

    if (!cycle) {
      throw new AppError('MRV cycle not found.', 404);
    }

    const project = cycle.get('project') as any;
    if (project.developerId !== developerId) {
      throw new AppError('Access denied.', 403);
    }

    // Verify document exists and belongs to the same project
    const document = await Document.findOne({
      where: { id: data.documentId, projectId: cycle.projectId },
    });

    if (!document) {
      throw new AppError('Document not found or does not belong to this project.', 404);
    }

    // Verify measurement if specified
    if (data.measurementId) {
      const measurement = await Measurement.findOne({
        where: { id: data.measurementId, mrvCycleId },
      });
      if (!measurement) {
        throw new AppError('Measurement not found in this monitoring cycle.', 404);
      }
    }

    const evidence = await MRVEvidence.create({
      projectId: cycle.projectId,
      mrvCycleId,
      measurementId: data.measurementId || null,
      documentId: data.documentId,
      evidenceType: data.evidenceType || 'Field Observation',
      description: data.description || null,
      uploadedById: developerId,
    });

    await this.logAudit(
      developerId,
      cycle.projectId,
      mrvCycleId,
      'mrv_cycle_updated',
      'MRVEvidence',
      evidence.id,
      { documentName: document.documentName, evidenceType: data.evidenceType }
    );

    return (await MRVEvidence.findByPk(evidence.id, {
      include: [{ model: Document, as: 'document' }],
    }))!;
  }

  /**
   * List evidence for a cycle
   */
  static async listEvidence(mrvCycleId: string, developerId: string): Promise<MRVEvidence[]> {
    const cycle = await MRVCycle.findByPk(mrvCycleId, {
      include: [{ model: Project, as: 'project', attributes: ['developerId'] }],
    });

    if (!cycle) {
      throw new AppError('MRV cycle not found.', 404);
    }

    const project = cycle.get('project') as any;
    if (project.developerId !== developerId) {
      throw new AppError('Access denied.', 403);
    }

    return await MRVEvidence.findAll({
      where: { mrvCycleId },
      include: [
        {
          model: Document,
          as: 'document',
          attributes: ['id', 'documentName', 'documentType', 'originalFileName', 'fileSizeBytes', 'mimeType', 'createdAt'],
        },
        {
          model: Measurement,
          as: 'measurement',
          attributes: ['id', 'value', 'unit', 'measurementDate'],
          include: [{ model: MeasurementType, as: 'measurementType', attributes: ['name'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Delete evidence attachment
   */
  static async deleteEvidence(evidenceId: string, developerId: string): Promise<void> {
    const evidence = await MRVEvidence.findByPk(evidenceId, {
      include: [{ model: Project, as: 'project', attributes: ['developerId'] }],
    });

    if (!evidence) {
      throw new AppError('Evidence record not found.', 404);
    }

    const project = evidence.get('project') as any;
    if (project.developerId !== developerId) {
      throw new AppError('Access denied.', 403);
    }

    await evidence.destroy();
  }

  /**
   * Generate MRV Report from cycle data
   */
  static async generateReport(mrvCycleId: string, developerId: string): Promise<MRVReport> {
    const cycle = await MRVCycle.findByPk(mrvCycleId, {
      include: [{ association: 'project', attributes: ['developerId'] }],
    });

    if (!cycle) {
      throw new AppError('MRV cycle not found.', 404);
    }

    const project = cycle.get('project') as any;
    if (project.developerId !== developerId) {
      throw new AppError('Access denied.', 403);
    }

    // Calculate statistics
    const stats = await this.calculateCycleStats(mrvCycleId);

    // Check if report already exists
    let report = await MRVReport.findOne({
      where: { mrvCycleId },
    });

    if (report) {
      // Update existing report
      await report.update({
        totalMeasurements: stats.totalMeasurements,
        validMeasurements: stats.validMeasurements,
        invalidMeasurements: stats.invalidMeasurements,
        completionPercentage: stats.completionPercentage,
        validationPercentage: stats.validationPercentage,
        generatedAt: new Date(),
        status: 'generated',
      });
    } else {
      // Create new report
      report = await MRVReport.create({
        projectId: cycle.projectId,
        mrvCycleId,
        status: 'generated',
        totalMeasurements: stats.totalMeasurements,
        validMeasurements: stats.validMeasurements,
        invalidMeasurements: stats.invalidMeasurements,
        completionPercentage: stats.completionPercentage,
        validationPercentage: stats.validationPercentage,
        generatedAt: new Date(),
      });
    }

    // Also update cycle status if in validation
    if (['draft', 'data_collection', 'data_submitted', 'validation', 'validated'].includes(cycle.status)) {
      await cycle.update({ status: 'report_generated' });
    }

    // Log audit event
    await this.logAudit(
      developerId,
      cycle.projectId,
      mrvCycleId,
      'report_generated',
      'MRVReport',
      report.id
    );

    return report;
  }

  /**
   * Submit report for verification
   */
  static async submitReport(reportId: string, developerId: string): Promise<MRVReport> {
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

    const cycle = report.get('mrvCycle') as any;
    if (cycle.project.developerId !== developerId) {
      throw new AppError('Access denied.', 403);
    }

    await report.update({
      status: 'submitted',
      submittedAt: new Date(),
    });

    // Update cycle status
    await cycle.update({ status: 'submitted_for_verification' });

    // Log audit event
    await this.logAudit(
      developerId,
      report.projectId,
      report.mrvCycleId,
      'report_submitted',
      'MRVReport',
      reportId
    );

    return report;
  }

  /**
   * Record verification decision
   */
  static async recordVerification(
    reportId: string,
    developerId: string,
    status: 'verified' | 'rejected' | 'requires_changes',
    comments?: string | null,
    findings?: string | null
  ): Promise<Verification> {
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

    const cycle = report.get('mrvCycle') as any;
    if (cycle.project.developerId !== developerId) {
      throw new AppError('Access denied.', 403);
    }

    // Get or create verification record
    let verification = await Verification.findOne({
      where: { mrvReportId: reportId },
    });

    if (verification) {
      await verification.update({
        status,
        comments: comments || verification.comments,
        findings: findings || verification.findings,
        verifiedBy: developerId,
        verifiedAt: new Date(),
      });
    } else {
      verification = await Verification.create({
        mrvReportId: reportId,
        status,
        comments: comments || null,
        findings: findings || null,
        verifiedBy: developerId,
        verifiedAt: new Date(),
      });
    }

    // Update report status
    const reportStatus = status === 'verified' ? 'verified' : status === 'rejected' ? 'rejected' : 'under_verification';
    await report.update({ status: reportStatus as any });

    // Update cycle status
    const cycleStatus = status === 'verified' ? 'verified' : status === 'requires_changes' ? 'needs_correction' : 'rejected';
    await cycle.update({ status: cycleStatus, verifiedAt: status === 'verified' ? new Date() : null });

    // Log audit event
    await this.logAudit(
      developerId,
      report.projectId,
      report.mrvCycleId,
      'verification_completed',
      'Verification',
      verification.id,
      { status, comments }
    );

    return verification;
  }

  /**
   * Log audit event
   */
  static async logAudit(
    userId: string,
    projectId: string,
    mrvCycleId: string | null,
    action: any,
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await AuditLog.create({
        userId,
        projectId,
        mrvCycleId,
        action,
        entityType,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });
    } catch (err) {
      console.error('Failed to log audit event:', err);
    }
  }

  /**
   * List MRV cycles for project
   */
  static async listMRVCycles(
    projectId: string,
    developerId: string,
    status?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ cycles: any[]; total: number }> {
    const where: any = { projectId };
    if (status) where.status = status;

    const { count, rows } = await MRVCycle.findAndCountAll({
      where,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'projectCode', 'projectType', 'status'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    // Compute basic statistics for each cycle
    const cyclesWithStats = await Promise.all(
      rows.map(async (cycle) => {
        const stats = await this.calculateCycleStats(cycle.id);
        return {
          ...cycle.toJSON(),
          stats,
        };
      })
    );

    return { cycles: cyclesWithStats, total: count };
  }

  /**
   * List measurements for cycle with full relational context
   */
  static async listMeasurements(
    mrvCycleId: string,
    developerId: string,
    status?: string,
    category?: string,
    page: number = 1,
    limit: number = 100
  ): Promise<{ measurements: Measurement[]; total: number }> {
    const where: any = { mrvCycleId };
    if (status) where.status = status;
    if (category) where.dataCategory = category;

    const { count, rows } = await Measurement.findAndCountAll({
      where,
      include: [
        { model: MeasurementType, as: 'measurementType' },
        {
          model: Participant,
          as: 'participant',
          attributes: ['id', 'fullName', 'plotId', 'plotAreaHa', 'participantType', 'village', 'district'],
        },
        {
          model: MRVEvidence,
          as: 'evidence',
          include: [
            {
              model: Document,
              as: 'document',
              attributes: ['id', 'documentName', 'documentType', 'originalFileName', 'fileSizeBytes', 'mimeType'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    return { measurements: rows, total: count };
  }

  /**
   * Comprehensive MRV Dashboard Statistics across projects
   */
  static async getDashboardStats(developerId: string, projectId?: string): Promise<any> {
    const projectWhere: any = { developerId };
    if (projectId) projectWhere.id = projectId;

    const projects = await Project.findAll({
      where: projectWhere,
      attributes: ['id', 'name', 'projectCode', 'projectType', 'status', 'hasGIS', 'estimatedAnnualCO2Tonnes'],
      order: [['updatedAt', 'DESC']],
    });

    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) {
      return {
        summary: {
          totalCycles: 0,
          draftCycles: 0,
          inProgressCycles: 0,
          submittedCycles: 0,
          verifiedCycles: 0,
          rejectedCycles: 0,
          totalMeasurements: 0,
          validMeasurements: 0,
          invalidMeasurements: 0,
          pendingMeasurements: 0,
          totalEvidenceCount: 0,
        },
        recentActivity: [],
        cyclesByProject: [],
        activeCycles: [],
        attentionItems: [],
      };
    }

    const [cycles, measurements, totalEvidenceCount, recentAuditLogs] = await Promise.all([
      MRVCycle.findAll({
        where: { projectId: { [Op.in]: projectIds } },
        include: [{ model: Project, as: 'project', attributes: ['id', 'name', 'projectCode'] }],
        order: [['updatedAt', 'DESC']],
      }),
      Measurement.findAll({
        where: { projectId: { [Op.in]: projectIds } },
        attributes: ['id', 'status', 'projectId', 'mrvCycleId'],
      }),
      MRVEvidence.count({
        where: { projectId: { [Op.in]: projectIds } },
      }),
      AuditLog.findAll({
        where: { projectId: { [Op.in]: projectIds } },
        order: [['createdAt', 'DESC']],
        limit: 10,
        include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
      }),
    ]);

    const totalCycles = cycles.length;
    const draftCycles = cycles.filter((c) => c.status === 'draft').length;
    const inProgressCycles = cycles.filter((c) => c.status === 'data_collection').length;
    const submittedCycles = cycles.filter((c) =>
      ['data_submitted', 'validation', 'submitted_for_verification', 'under_verification'].includes(c.status)
    ).length;
    const verifiedCycles = cycles.filter((c) => c.status === 'verified').length;
    const rejectedCycles = cycles.filter((c) => ['rejected', 'needs_correction'].includes(c.status)).length;

    const totalMeasurements = measurements.length;
    const validMeasurements = measurements.filter((m) => m.status === 'valid').length;
    const invalidMeasurements = measurements.filter((m) => m.status === 'invalid').length;
    const pendingMeasurements = measurements.filter((m) => ['draft', 'submitted'].includes(m.status)).length;

    // Per-project cycle summaries
    const cyclesByProject = projects.map((proj) => {
      const projCycles = cycles.filter((c) => c.projectId === proj.id);
      const projMeasurements = measurements.filter((m) => m.projectId === proj.id);
      const latestCycle = projCycles[0] || null;

      return {
        project: proj,
        totalCycles: projCycles.length,
        activeCycle: latestCycle ? { id: latestCycle.id, name: latestCycle.cycleName, status: latestCycle.status } : null,
        totalMeasurements: projMeasurements.length,
        verifiedCycles: projCycles.filter((c) => c.status === 'verified').length,
      };
    });

    // Items needing attention
    const attentionItems = cycles
      .filter((c) =>
        ['needs_correction', 'submitted_for_verification', 'data_submitted', 'rejected'].includes(c.status)
      )
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        projectId: c.projectId,
        projectName: (c as any).project?.name || 'Project',
        cycleName: c.cycleName,
        cycleCode: c.cycleCode,
        status: c.status,
        monitoringEndDate: c.monitoringEndDate,
      }));

    return {
      summary: {
        totalCycles,
        draftCycles,
        inProgressCycles,
        submittedCycles,
        verifiedCycles,
        rejectedCycles,
        totalMeasurements,
        validMeasurements,
        invalidMeasurements,
        pendingMeasurements,
        totalEvidenceCount,
      },
      recentActivity: recentAuditLogs,
      cyclesByProject,
      activeCycles: cycles.slice(0, 10),
      attentionItems,
    };
  }
}
