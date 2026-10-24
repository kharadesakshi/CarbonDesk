import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface CarbonDeveloperAttributes {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  organizationName: string | null;
  organizationType: string | null;
  registrationNumber: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  profileStatus: 'active' | 'inactive' | 'pending_verification';
  bio: string | null;
  website: string | null;
  // Extensible KYC fields
  kycStatus: 'not_started' | 'pending' | 'verified' | 'rejected';
  kycSubmittedAt: Date | null;
  kycVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CarbonDeveloperCreationAttributes = Optional<
  CarbonDeveloperAttributes,
  | 'id'
  | 'phone'
  | 'organizationName'
  | 'organizationType'
  | 'registrationNumber'
  | 'country'
  | 'state'
  | 'city'
  | 'address'
  | 'bio'
  | 'website'
  | 'kycStatus'
  | 'kycSubmittedAt'
  | 'kycVerifiedAt'
  | 'lastLoginAt'
  | 'profileStatus'
>;

class CarbonDeveloper
  extends Model<CarbonDeveloperAttributes, CarbonDeveloperCreationAttributes>
  implements CarbonDeveloperAttributes
{
  declare id: string;
  declare fullName: string;
  declare email: string;
  declare passwordHash: string;
  declare phone: string | null;
  declare organizationName: string | null;
  declare organizationType: string | null;
  declare registrationNumber: string | null;
  declare country: string | null;
  declare state: string | null;
  declare city: string | null;
  declare address: string | null;
  declare profileStatus: 'active' | 'inactive' | 'pending_verification';
  declare bio: string | null;
  declare website: string | null;
  declare kycStatus: 'not_started' | 'pending' | 'verified' | 'rejected';
  declare kycSubmittedAt: Date | null;
  declare kycVerifiedAt: Date | null;
  declare lastLoginAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CarbonDeveloper.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: { notEmpty: true, len: [2, 200] },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    organizationName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    organizationType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    registrationNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    profileStatus: {
      type: DataTypes.ENUM('active', 'inactive', 'pending_verification'),
      defaultValue: 'active',
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    kycStatus: {
      type: DataTypes.ENUM('not_started', 'pending', 'verified', 'rejected'),
      defaultValue: 'not_started',
      allowNull: false,
    },
    kycSubmittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    kycVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'carbon_developers',
    modelName: 'CarbonDeveloper',
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['profileStatus'] },
    ],
  }
);

export default CarbonDeveloper;
