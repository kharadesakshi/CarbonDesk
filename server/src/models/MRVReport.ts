import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type MRVReportStatus =
  | 'draft'
  | 'generated'
  | 'submitted'
  | 'under_verification'
  | 'verified'
  | 'rejected';

export interface MRVReportAttributes {
  id: string;
  projectId: string;
  mrvCycleId: string;
  status: MRVReportStatus;
  reportContent: string | null; // JSON or HTML structure
  totalMeasurements: number;
  validMeasurements: number;
  invalidMeasurements: number;
  completionPercentage: number;
  validationPercentage: number;
  generatedAt: Date | null;
  submittedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MRVReportCreationAttributes = Optional<
  MRVReportAttributes,
  | 'id'
  | 'status'
  | 'reportContent'
  | 'totalMeasurements'
  | 'validMeasurements'
  | 'invalidMeasurements'
  | 'completionPercentage'
  | 'validationPercentage'
  | 'generatedAt'
  | 'submittedAt'
>;

class MRVReport
  extends Model<MRVReportAttributes, MRVReportCreationAttributes>
  implements MRVReportAttributes
{
  declare id: string;
  declare projectId: string;
  declare mrvCycleId: string;
  declare status: MRVReportStatus;
  declare reportContent: string | null;
  declare totalMeasurements: number;
  declare validMeasurements: number;
  declare invalidMeasurements: number;
  declare completionPercentage: number;
  declare validationPercentage: number;
  declare generatedAt: Date | null;
  declare submittedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MRVReport.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'projects', key: 'id' },
    },
    mrvCycleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'mrv_cycles', key: 'id' },
    },
    status: {
      type: DataTypes.ENUM('draft', 'generated', 'submitted', 'under_verification', 'verified', 'rejected'),
      defaultValue: 'draft',
      allowNull: false,
    },
    reportContent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    totalMeasurements: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    validMeasurements: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    invalidMeasurements: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    completionPercentage: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      allowNull: false,
    },
    validationPercentage: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      allowNull: false,
    },
    generatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'mrv_reports',
    modelName: 'MRVReport',
    indexes: [
      { fields: ['projectId'] },
      { fields: ['mrvCycleId'] },
      { fields: ['status'] },
    ],
  }
);

export default MRVReport;
