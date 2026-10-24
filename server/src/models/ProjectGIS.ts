import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ProjectGISAttributes {
  id: string;
  projectId: string;
  // Centroid / reference point
  centerLatitude: number | null;
  centerLongitude: number | null;
  // GeoJSON boundary — stored as TEXT to keep pure PostgreSQL (no PostGIS required)
  // When PostGIS is available, this can be migrated to GEOMETRY type
  boundaryGeoJSON: string | null;  // GeoJSON Feature or FeatureCollection as string
  // Computed area (from GeoJSON calculation)
  calculatedAreaHa: number | null;
  perimeterKm: number | null;
  // CRS / coordinate reference information
  coordinateSystem: string | null;  // e.g., "WGS84", "EPSG:4326"
  // Metadata
  mapZoom: number | null;
  lastEditedAt: Date | null;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProjectGISCreationAttributes = Optional<
  ProjectGISAttributes,
  | 'id'
  | 'centerLatitude'
  | 'centerLongitude'
  | 'boundaryGeoJSON'
  | 'calculatedAreaHa'
  | 'perimeterKm'
  | 'coordinateSystem'
  | 'mapZoom'
  | 'lastEditedAt'
  | 'notes'
>;

class ProjectGIS
  extends Model<ProjectGISAttributes, ProjectGISCreationAttributes>
  implements ProjectGISAttributes
{
  declare id: string;
  declare projectId: string;
  declare centerLatitude: number | null;
  declare centerLongitude: number | null;
  declare boundaryGeoJSON: string | null;
  declare calculatedAreaHa: number | null;
  declare perimeterKm: number | null;
  declare coordinateSystem: string | null;
  declare mapZoom: number | null;
  declare lastEditedAt: Date | null;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ProjectGIS.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'projects', key: 'id' },
    },
    centerLatitude: { type: DataTypes.DOUBLE, allowNull: true },
    centerLongitude: { type: DataTypes.DOUBLE, allowNull: true },
    // Stored as TEXT — design allows future migration to PostGIS GEOMETRY column
    boundaryGeoJSON: { type: DataTypes.TEXT, allowNull: true },
    calculatedAreaHa: { type: DataTypes.DOUBLE, allowNull: true },
    perimeterKm: { type: DataTypes.DOUBLE, allowNull: true },
    coordinateSystem: { type: DataTypes.STRING(50), allowNull: true, defaultValue: 'WGS84' },
    mapZoom: { type: DataTypes.DOUBLE, allowNull: true },
    lastEditedAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'project_gis',
    modelName: 'ProjectGIS',
    indexes: [{ unique: true, fields: ['projectId'] }],
  }
);

export default ProjectGIS;
