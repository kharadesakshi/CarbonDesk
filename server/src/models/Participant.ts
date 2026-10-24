import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type ParticipantStatus = 'active' | 'inactive' | 'pending';
export type ParticipantType =
  | 'Individual Farmer'
  | 'Community Group'
  | 'Land Owner'
  | 'Cooperative'
  | 'NGO'
  | 'Government'
  | 'Private Company'
  | 'Other';

export interface ParticipantAttributes {
  id: string;
  projectId: string;
  participantCode: string | null;
  fullName: string;
  participantType: string;
  email: string | null;
  phone: string | null;
  // Address
  village: string | null;
  district: string | null;
  stateRegion: string | null;
  country: string | null;
  address: string | null;
  // Land / plot information
  plotId: string | null;
  plotAreaHa: number | null;
  plotDescription: string | null;
  // Participation
  status: ParticipantStatus;
  enrollmentDate: Date | null;
  consentGiven: boolean;
  consentDate: Date | null;
  additionalNotes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ParticipantCreationAttributes = Optional<
  ParticipantAttributes,
  | 'id'
  | 'participantCode'
  | 'email'
  | 'phone'
  | 'village'
  | 'district'
  | 'stateRegion'
  | 'country'
  | 'address'
  | 'plotId'
  | 'plotAreaHa'
  | 'plotDescription'
  | 'status'
  | 'enrollmentDate'
  | 'consentGiven'
  | 'consentDate'
  | 'additionalNotes'
>;

class Participant
  extends Model<ParticipantAttributes, ParticipantCreationAttributes>
  implements ParticipantAttributes
{
  declare id: string;
  declare projectId: string;
  declare participantCode: string | null;
  declare fullName: string;
  declare participantType: string;
  declare email: string | null;
  declare phone: string | null;
  declare village: string | null;
  declare district: string | null;
  declare stateRegion: string | null;
  declare country: string | null;
  declare address: string | null;
  declare plotId: string | null;
  declare plotAreaHa: number | null;
  declare plotDescription: string | null;
  declare status: ParticipantStatus;
  declare enrollmentDate: Date | null;
  declare consentGiven: boolean;
  declare consentDate: Date | null;
  declare additionalNotes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Participant.init(
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
    participantCode: { type: DataTypes.STRING(100), allowNull: true },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: true },
    },
    participantType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Individual Farmer',
    },
    email: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING(50), allowNull: true },
    village: { type: DataTypes.STRING(100), allowNull: true },
    district: { type: DataTypes.STRING(100), allowNull: true },
    stateRegion: { type: DataTypes.STRING(100), allowNull: true },
    country: { type: DataTypes.STRING(100), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    plotId: { type: DataTypes.STRING(100), allowNull: true },
    plotAreaHa: { type: DataTypes.DOUBLE, allowNull: true },
    plotDescription: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending'),
      defaultValue: 'pending',
      allowNull: false,
    },
    enrollmentDate: { type: DataTypes.DATEONLY, allowNull: true },
    consentGiven: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    consentDate: { type: DataTypes.DATEONLY, allowNull: true },
    additionalNotes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'participants',
    modelName: 'Participant',
    indexes: [
      { fields: ['projectId'] },
      { fields: ['status'] },
      { fields: ['fullName'] },
    ],
  }
);

export default Participant;
