import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type ProjectStatus = 'draft' | 'active' | 'under_review' | 'validated' | 'archived';
export type ProjectType =
  | 'ARR'
  | 'REDD+'
  | 'Blue Carbon'
  | 'ALM'
  | 'IFM'
  | 'Urban Forestry'
  | 'Cookstoves'
  | 'Biogas'
  | 'Solar'
  | 'Wind'
  | 'Methane Capture'
  | 'Other';

export interface ProjectAttributes {
  id: string;
  developerId: string;
  name: string;
  projectCode: string | null;
  description: string | null;
  projectType: string;
  category: string | null;
  methodology: string | null;
  status: ProjectStatus;
  // Location
  country: string | null;
  stateRegion: string | null;
  district: string | null;
  cityVillage: string | null;
  addressDescription: string | null;
  latitude: number | null;
  longitude: number | null;
  // Project details
  startDate: Date | null;
  expectedDurationYears: number | null;
  projectAreaHa: number | null;
  estimatedAnnualCO2Tonnes: number | null;
  expectedCarbonCredits: number | null;
  targetCertification: string | null;
  monitoringFrequency: string | null;
  additionalNotes: string | null;
  // Computed / denormalized
  participantCount: number;
  hasGIS: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProjectCreationAttributes = Optional<
  ProjectAttributes,
  | 'id'
  | 'projectCode'
  | 'description'
  | 'category'
  | 'methodology'
  | 'status'
  | 'country'
  | 'stateRegion'
  | 'district'
  | 'cityVillage'
  | 'addressDescription'
  | 'latitude'
  | 'longitude'
  | 'startDate'
  | 'expectedDurationYears'
  | 'projectAreaHa'
  | 'estimatedAnnualCO2Tonnes'
  | 'expectedCarbonCredits'
  | 'targetCertification'
  | 'monitoringFrequency'
  | 'additionalNotes'
  | 'participantCount'
  | 'hasGIS'
>;

class Project
  extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes
{
  declare id: string;
  declare developerId: string;
  declare name: string;
  declare projectCode: string | null;
  declare description: string | null;
  declare projectType: string;
  declare category: string | null;
  declare methodology: string | null;
  declare status: ProjectStatus;
  declare country: string | null;
  declare stateRegion: string | null;
  declare district: string | null;
  declare cityVillage: string | null;
  declare addressDescription: string | null;
  declare latitude: number | null;
  declare longitude: number | null;
  declare startDate: Date | null;
  declare expectedDurationYears: number | null;
  declare projectAreaHa: number | null;
  declare estimatedAnnualCO2Tonnes: number | null;
  declare expectedCarbonCredits: number | null;
  declare targetCertification: string | null;
  declare monitoringFrequency: string | null;
  declare additionalNotes: string | null;
  declare participantCount: number;
  declare hasGIS: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    developerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'carbon_developers', key: 'id' },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: true, len: [2, 255] },
    },
    projectCode: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    projectType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    methodology: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'under_review', 'validated', 'archived'),
      defaultValue: 'draft',
      allowNull: false,
    },
    country: { type: DataTypes.STRING(100), allowNull: true },
    stateRegion: { type: DataTypes.STRING(100), allowNull: true },
    district: { type: DataTypes.STRING(100), allowNull: true },
    cityVillage: { type: DataTypes.STRING(100), allowNull: true },
    addressDescription: { type: DataTypes.TEXT, allowNull: true },
    latitude: { type: DataTypes.DOUBLE, allowNull: true },
    longitude: { type: DataTypes.DOUBLE, allowNull: true },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    expectedDurationYears: { type: DataTypes.INTEGER, allowNull: true },
    projectAreaHa: { type: DataTypes.DOUBLE, allowNull: true },
    estimatedAnnualCO2Tonnes: { type: DataTypes.DOUBLE, allowNull: true },
    expectedCarbonCredits: { type: DataTypes.DOUBLE, allowNull: true },
    targetCertification: { type: DataTypes.STRING(255), allowNull: true },
    monitoringFrequency: { type: DataTypes.STRING(100), allowNull: true },
    additionalNotes: { type: DataTypes.TEXT, allowNull: true },
    participantCount: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    hasGIS: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
  },
  {
    sequelize,
    tableName: 'projects',
    modelName: 'Project',
    indexes: [
      { fields: ['developerId'] },
      { fields: ['status'] },
      { fields: ['projectType'] },
      { fields: ['country'] },
    ],
  }
);

export default Project;
