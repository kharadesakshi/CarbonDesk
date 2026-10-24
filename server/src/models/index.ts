import sequelize from '../config/database';
import CarbonDeveloper from './CarbonDeveloper';
import Project from './Project';
import Participant from './Participant';
import Document from './Document';
import ProjectGIS from './ProjectGIS';
import MRVCycle from './MRVCycle';
import Measurement from './Measurement';
import MeasurementType from './MeasurementType';
import MRVReport from './MRVReport';
import Verification from './Verification';
import AuditLog from './AuditLog';

// ─── Associations ─────────────────────────────────────────────────────────────

// Developer → Projects
CarbonDeveloper.hasMany(Project, {
  foreignKey: 'developerId',
  as: 'projects',
  onDelete: 'CASCADE',
});
Project.belongsTo(CarbonDeveloper, {
  foreignKey: 'developerId',
  as: 'developer',
});

// Project → Participants
Project.hasMany(Participant, {
  foreignKey: 'projectId',
  as: 'participants',
  onDelete: 'CASCADE',
});
Participant.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// Participant → Documents
Participant.hasMany(Document, {
  foreignKey: 'participantId',
  as: 'documents',
  onDelete: 'CASCADE',
});
Document.belongsTo(Participant, {
  foreignKey: 'participantId',
  as: 'participant',
});

// Project → Documents (project-level docs)
Project.hasMany(Document, {
  foreignKey: 'projectId',
  as: 'documents',
  onDelete: 'CASCADE',
});
Document.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// Project → GIS (one-to-one)
Project.hasOne(ProjectGIS, {
  foreignKey: 'projectId',
  as: 'gis',
  onDelete: 'CASCADE',
});
ProjectGIS.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// ─── MRV Associations ─────────────────────────────────────────────────────────

// Project → MRV Cycles (1:M)
Project.hasMany(MRVCycle, {
  foreignKey: 'projectId',
  as: 'mrvCycles',
  onDelete: 'CASCADE',
});
MRVCycle.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// MRVCycle → Measurements (1:M)
MRVCycle.hasMany(Measurement, {
  foreignKey: 'mrvCycleId',
  as: 'measurements',
  onDelete: 'CASCADE',
});
Measurement.belongsTo(MRVCycle, {
  foreignKey: 'mrvCycleId',
  as: 'mrvCycle',
});

// MRVCycle → Reports (1:M)
MRVCycle.hasMany(MRVReport, {
  foreignKey: 'mrvCycleId',
  as: 'reports',
  onDelete: 'CASCADE',
});
MRVReport.belongsTo(MRVCycle, {
  foreignKey: 'mrvCycleId',
  as: 'mrvCycle',
});

// Project → Measurements (1:M for convenience)
Project.hasMany(Measurement, {
  foreignKey: 'projectId',
  as: 'measurements',
});
Measurement.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// Participant → Measurements (1:M, optional)
Participant.hasMany(Measurement, {
  foreignKey: 'participantId',
  as: 'measurements',
});
Measurement.belongsTo(Participant, {
  foreignKey: 'participantId',
  as: 'participant',
});

// MeasurementType → Measurements (1:M)
MeasurementType.hasMany(Measurement, {
  foreignKey: 'measurementTypeId',
  as: 'measurements',
});
Measurement.belongsTo(MeasurementType, {
  foreignKey: 'measurementTypeId',
  as: 'measurementType',
});

// MRVReport → Verifications (1:M)
MRVReport.hasMany(Verification, {
  foreignKey: 'mrvReportId',
  as: 'verifications',
  onDelete: 'CASCADE',
});
Verification.belongsTo(MRVReport, {
  foreignKey: 'mrvReportId',
  as: 'report',
});

// Project → AuditLogs (1:M)
Project.hasMany(AuditLog, {
  foreignKey: 'projectId',
  as: 'auditLogs',
});
AuditLog.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// MRVCycle → AuditLogs (1:M, optional)
MRVCycle.hasMany(AuditLog, {
  foreignKey: 'mrvCycleId',
  as: 'auditLogs',
});
AuditLog.belongsTo(MRVCycle, {
  foreignKey: 'mrvCycleId',
  as: 'mrvCycle',
});

import MRVEvidence from './MRVEvidence';

// MRVCycle → Evidence (1:M)
MRVCycle.hasMany(MRVEvidence, {
  foreignKey: 'mrvCycleId',
  as: 'evidence',
  onDelete: 'CASCADE',
});
MRVEvidence.belongsTo(MRVCycle, {
  foreignKey: 'mrvCycleId',
  as: 'mrvCycle',
});

// Measurement → Evidence (1:M, optional)
Measurement.hasMany(MRVEvidence, {
  foreignKey: 'measurementId',
  as: 'evidence',
  onDelete: 'CASCADE',
});
MRVEvidence.belongsTo(Measurement, {
  foreignKey: 'measurementId',
  as: 'measurement',
});

// Document → MRVEvidence (1:M)
Document.hasMany(MRVEvidence, {
  foreignKey: 'documentId',
  as: 'evidenceLinks',
  onDelete: 'CASCADE',
});
MRVEvidence.belongsTo(Document, {
  foreignKey: 'documentId',
  as: 'document',
});

// Project → MRVEvidence (1:M)
Project.hasMany(MRVEvidence, {
  foreignKey: 'projectId',
  as: 'mrvEvidence',
  onDelete: 'CASCADE',
});
MRVEvidence.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

export {
  sequelize,
  CarbonDeveloper,
  Project,
  Participant,
  Document,
  ProjectGIS,
  MRVCycle,
  Measurement,
  MeasurementType,
  MRVReport,
  Verification,
  AuditLog,
  MRVEvidence,
};
