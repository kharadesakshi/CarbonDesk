import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'requires_changes';

export interface VerificationAttributes {
  id: string;
  mrvReportId: string;
  status: VerificationStatus;
  comments: string | null;
  findings: string | null;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type VerificationCreationAttributes = Optional<
  VerificationAttributes,
  'id' | 'status' | 'comments' | 'findings' | 'verifiedBy' | 'verifiedAt'
>;

class Verification
  extends Model<VerificationAttributes, VerificationCreationAttributes>
  implements VerificationAttributes
{
  declare id: string;
  declare mrvReportId: string;
  declare status: VerificationStatus;
  declare comments: string | null;
  declare findings: string | null;
  declare verifiedBy: string | null;
  declare verifiedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Verification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    mrvReportId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'mrv_reports', key: 'id' },
    },
    status: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected', 'requires_changes'),
      defaultValue: 'pending',
      allowNull: false,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    findings: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'carbon_developers', key: 'id' },
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'verifications',
    modelName: 'Verification',
    indexes: [
      { fields: ['mrvReportId'] },
      { fields: ['status'] },
    ],
  }
);

export default Verification;
