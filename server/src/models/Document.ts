import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type StorageProvider = 'local' | 's3';
export type DocumentVerificationStatus = 'pending' | 'verified' | 'rejected';
export type DocumentType =
  | 'Identity Document'
  | 'Land Ownership Document'
  | 'Consent Form'
  | 'Agreement'
  | 'Registration Document'
  | 'Project Design Document'
  | 'Baseline Report'
  | 'Monitoring Report'
  | 'Verification Report'
  | 'Map / GIS File'
  | 'Photo Evidence'
  | 'Other';

export interface DocumentAttributes {
  id: string;
  projectId: string;
  participantId: string | null;  // null = project-level document
  uploadedById: string;          // CarbonDeveloper id
  documentName: string;
  documentType: string;
  originalFileName: string;
  storageProvider: StorageProvider;
  storagePath: string;           // local path or S3 key — never exposed to frontend directly
  storageUrl: string | null;     // signed URL or null (generated on demand)
  fileSizeBytes: number;
  mimeType: string;
  verificationStatus: DocumentVerificationStatus;
  verificationNotes: string | null;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type DocumentCreationAttributes = Optional<
  DocumentAttributes,
  | 'id'
  | 'participantId'
  | 'storageUrl'
  | 'verificationStatus'
  | 'verificationNotes'
  | 'notes'
>;

class Document
  extends Model<DocumentAttributes, DocumentCreationAttributes>
  implements DocumentAttributes
{
  declare id: string;
  declare projectId: string;
  declare participantId: string | null;
  declare uploadedById: string;
  declare documentName: string;
  declare documentType: string;
  declare originalFileName: string;
  declare storageProvider: StorageProvider;
  declare storagePath: string;
  declare storageUrl: string | null;
  declare fileSizeBytes: number;
  declare mimeType: string;
  declare verificationStatus: DocumentVerificationStatus;
  declare verificationNotes: string | null;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Document.init(
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
    participantId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'participants', key: 'id' },
    },
    uploadedById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'carbon_developers', key: 'id' },
    },
    documentName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: true },
    },
    documentType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    originalFileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    storageProvider: {
      type: DataTypes.ENUM('local', 's3'),
      allowNull: false,
    },
    storagePath: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    storageUrl: {
      type: DataTypes.STRING(2000),
      allowNull: true,
    },
    fileSizeBytes: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
    },
    verificationNotes: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'documents',
    modelName: 'Document',
    indexes: [
      { fields: ['projectId'] },
      { fields: ['participantId'] },
      { fields: ['uploadedById'] },
      { fields: ['documentType'] },
    ],
  }
);

export default Document;
