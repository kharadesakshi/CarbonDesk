import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface MeasurementTypeAttributes {
  id: string;
  name: string;
  unit: string;
  description: string | null;
  category: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MeasurementTypeCreationAttributes = Optional<MeasurementTypeAttributes, 'id' | 'description' | 'category'>;

class MeasurementType
  extends Model<MeasurementTypeAttributes, MeasurementTypeCreationAttributes>
  implements MeasurementTypeAttributes
{
  declare id: string;
  declare name: string;
  declare unit: string;
  declare description: string | null;
  declare category: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MeasurementType.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: true },
    },
    unit: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'measurement_types',
    modelName: 'MeasurementType',
    indexes: [
      { fields: ['name'] },
      { fields: ['category'] },
    ],
  }
);

export default MeasurementType;
