import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type MRVCycleStatus =
  | 'draft'
  | 'data_collection'
  | 'data_submitted'
  | 'validation'
  | 'needs_correction'
  | 'validated'
  | 'report_generated'
  | 'submitted_for_verification'
  | 'under_verification'
  | 'verified'
  | 'rejected';

export interface MRVCycleAttributes {
  id: string;
  projectId: string;
  cycleName: string;
  cycleCode: string;
  monitoringStartDate: Date;
  monitoringEndDate: Date;
  status: MRVCycleStatus;
  description: string | null;
  createdBy: string;
  submittedAt: Date | null;
  validatedAt: Date | null;
  verifiedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MRVCycleCreationAttributes = Optional<
  MRVCycleAttributes,
  'id' | 'status' | 'description' | 'submittedAt' | 'validatedAt' | 'verifiedAt'
>;

class MRVCycle
  extends Model<MRVCycleAttributes, MRVCycleCreationAttributes>
  implements MRVCycleAttributes
{
  declare id: string;
  declare projectId: string;
  declare cycleName: string;
  declare cycleCode: string;
  declare monitoringStartDate: Date;
  declare monitoringEndDate: Date;
  declare status: MRVCycleStatus;
  declare description: string | null;
  declare createdBy: string;
  declare submittedAt: Date | null;
  declare validatedAt: Date | null;
  declare verifiedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MRVCycle.init(
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
    cycleName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: true },
    },
    cycleCode: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true },
    },
    monitoringStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    monitoringEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        'draft',
        'data_collection',
        'data_submitted',
        'validation',
        'needs_correction',
        'validated',
        'report_generated',
        'submitted_for_verification',
        'under_verification',
        'verified',
        'rejected'
      ),
      defaultValue: 'draft',
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'carbon_developers', key: 'id' },
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    validatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'mrv_cycles',
    modelName: 'MRVCycle',
    indexes: [
      { fields: ['projectId'] },
      { fields: ['status'] },
      { fields: ['cycleCode'] },
    ],
  }
);

export default MRVCycle;
