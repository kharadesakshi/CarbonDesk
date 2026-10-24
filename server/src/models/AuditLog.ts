import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type AuditAction =
  | 'mrv_cycle_created'
  | 'mrv_cycle_updated'
  | 'mrv_cycle_submitted'
  | 'measurement_created'
  | 'measurement_updated'
  | 'measurement_submitted'
  | 'measurement_validated'
  | 'measurement_rejected'
  | 'report_generated'
  | 'report_submitted'
  | 'verification_recorded'
  | 'verification_completed';

export interface AuditLogAttributes {
  id: string;
  userId: string;
  projectId: string;
  mrvCycleId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata: string | null; // JSON
  createdAt?: Date;
}

export type AuditLogCreationAttributes = Optional<AuditLogAttributes, 'id' | 'mrvCycleId' | 'metadata'>;

class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  declare id: string;
  declare userId: string;
  declare projectId: string;
  declare mrvCycleId: string | null;
  declare action: AuditAction;
  declare entityType: string;
  declare entityId: string;
  declare metadata: string | null;
  declare readonly createdAt: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'carbon_developers', key: 'id' },
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'projects', key: 'id' },
    },
    mrvCycleId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'mrv_cycles', key: 'id' },
    },
    action: {
      type: DataTypes.ENUM(
        'mrv_cycle_created',
        'mrv_cycle_updated',
        'mrv_cycle_submitted',
        'measurement_created',
        'measurement_updated',
        'measurement_submitted',
        'measurement_validated',
        'measurement_rejected',
        'report_generated',
        'report_submitted',
        'verification_recorded',
        'verification_completed'
      ),
      allowNull: false,
    },
    entityType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    modelName: 'AuditLog',
    indexes: [
      { fields: ['projectId'] },
      { fields: ['mrvCycleId'] },
      { fields: ['action'] },
      { fields: ['createdAt'] },
    ],
    timestamps: true,
    updatedAt: false,
  }
);

export default AuditLog;
