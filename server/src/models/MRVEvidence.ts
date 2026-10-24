import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface MRVEvidenceAttributes {
  id: string;
  projectId: string;
  mrvCycleId: string;
  measurementId: string | null;
  documentId: string;
  evidenceType: string;
  description: string | null;
  uploadedById: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MRVEvidenceCreationAttributes = Optional<
  MRVEvidenceAttributes,
  'id' | 'measurementId' | 'description' | 'createdAt' | 'updatedAt'
>;

class MRVEvidence
  extends Model<MRVEvidenceAttributes, MRVEvidenceCreationAttributes>
  implements MRVEvidenceAttributes
{
  declare id: string;
  declare projectId: string;
  declare mrvCycleId: string;
  declare measurementId: string | null;
  declare documentId: string;
  declare evidenceType: string;
  declare description: string | null;
  declare uploadedById: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MRVEvidence.init(
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
    measurementId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'measurements', key: 'id' },
    },
    documentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'documents', key: 'id' },
    },
    evidenceType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Field Observation',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    uploadedById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'carbon_developers', key: 'id' },
    },
  },
  {
    sequelize,
    tableName: 'mrv_evidence',
    modelName: 'MRVEvidence',
    indexes: [
      { fields: ['projectId'] },
      { fields: ['mrvCycleId'] },
      { fields: ['measurementId'] },
      { fields: ['documentId'] },
    ],
  }
);

export default MRVEvidence;
