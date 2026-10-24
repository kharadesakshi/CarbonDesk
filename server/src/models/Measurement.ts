import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type MeasurementStatus = 'draft' | 'submitted' | 'valid' | 'invalid' | 'needs_correction';
export type MeasurementSource = 'manual' | 'field_survey' | 'document' | 'gis' | 'satellite' | 'iot' | 'import' | 'other';
export type MeasurementDataCategory = 'baseline' | 'project' | 'monitoring';

export interface MeasurementAttributes {
  id: string;
  mrvCycleId: string;
  projectId: string;
  participantId: string | null;
  measurementTypeId: string;
  value: number;
  unit: string;
  measurementDate: Date;
  source: MeasurementSource;
  dataCategory: MeasurementDataCategory;
  status: MeasurementStatus;
  locationCoordinates?: string | null;
  plotReference?: string | null;
  notes: string | null;
  validationNotes: string | null;
  submittedAt: Date | null;
  validatedAt: Date | null;
  validatedBy: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MeasurementCreationAttributes = Optional<
  MeasurementAttributes,
  | 'id'
  | 'participantId'
  | 'locationCoordinates'
  | 'plotReference'
  | 'status'
  | 'notes'
  | 'validationNotes'
  | 'submittedAt'
  | 'validatedAt'
  | 'validatedBy'
>;

class Measurement
  extends Model<MeasurementAttributes, MeasurementCreationAttributes>
  implements MeasurementAttributes
{
  declare id: string;
  declare mrvCycleId: string;
  declare projectId: string;
  declare participantId: string | null;
  declare measurementTypeId: string;
  declare value: number;
  declare unit: string;
  declare measurementDate: Date;
  declare source: MeasurementSource;
  declare dataCategory: MeasurementDataCategory;
  declare status: MeasurementStatus;
  declare locationCoordinates: string | null;
  declare plotReference: string | null;
  declare notes: string | null;
  declare validationNotes: string | null;
  declare submittedAt: Date | null;
  declare validatedAt: Date | null;
  declare validatedBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Measurement.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    mrvCycleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'mrv_cycles', key: 'id' },
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'projects', key: 'id' },
    },
    participantId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'participants', key: 'id' },
    },
    measurementTypeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'measurement_types', key: 'id' },
    },
    value: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      validate: { isNumeric: true },
    },
    unit: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    measurementDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    source: {
      type: DataTypes.ENUM('manual', 'field_survey', 'document', 'gis', 'satellite', 'iot', 'import', 'other'),
      defaultValue: 'manual',
      allowNull: false,
    },
    dataCategory: {
      type: DataTypes.ENUM('baseline', 'project', 'monitoring'),
      defaultValue: 'monitoring',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'valid', 'invalid', 'needs_correction'),
      defaultValue: 'draft',
      allowNull: false,
    },
    locationCoordinates: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    plotReference: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    validationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    validatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    validatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'carbon_developers', key: 'id' },
    },
  },
  {
    sequelize,
    tableName: 'measurements',
    modelName: 'Measurement',
    indexes: [
      { fields: ['mrvCycleId'] },
      { fields: ['projectId'] },
      { fields: ['participantId'] },
      { fields: ['measurementTypeId'] },
      { fields: ['status'] },
      { fields: ['dataCategory'] },
    ],
  }
);

export default Measurement;
