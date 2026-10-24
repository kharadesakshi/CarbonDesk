/**
 * PostGIS Adapter - Optional advanced geographic calculations
 * 
 * When the platform scales or requires advanced spatial analysis, uncomment
 * and enable this adapter to use PostgreSQL's PostGIS extension.
 * 
 * Prerequisites:
 * 1. PostgreSQL 12+ with PostGIS extension installed
 * 2. npm install pg-promise (optional, for direct queries)
 * 
 * Enable PostGIS:
 * 1. In PostgreSQL: CREATE EXTENSION postgis;
 * 2. Set USE_POSTGIS=true in .env
 * 3. Uncomment implementations below
 * 
 * PostGIS provides:
 * - Accurate geographic calculations (vs turf.js approximations)
 * - Spatial indexing for large polygon operations
 * - Complex spatial operations (buffer, intersection, union, etc.)
 * - Raster support for satellite data integration
 * - Performance optimization for thousands of features
 */

import sequelize from '../../config/database';

export interface PostGISMetrics {
  areaHa: number;
  perimeterKm: number;
  isValid: boolean;
  message?: string;
}

export class PostGISAdapter {
  /**
   * Check if PostGIS is enabled
   */
  static isEnabled(): boolean {
    return process.env.USE_POSTGIS === 'true';
  }

  /**
   * Calculate accurate area using PostGIS ST_Area
   * 
   * ST_Area returns area in square meters for geographic types
   * Divide by 10000 to get hectares
   * 
   * Usage:
   * SELECT ST_Area(ST_GeomFromGeoJSON(...)::geography) / 10000 AS area_ha
   */
  static async calculateAreaPostGIS(geoJSON: string): Promise<number> {
    /*
    try {
      const result = await sequelize.query(`
        SELECT ST_Area(ST_GeomFromGeoJSON($1)::geography) / 10000 as area_ha
      `, {
        replacements: [geoJSON],
        type: QueryTypes.SELECT,
      });

      if (result.length === 0) return 0;
      return (result[0] as any).area_ha || 0;
    } catch (err) {
      throw new Error(`PostGIS area calculation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    */
    throw new Error('PostGIS not enabled. Set USE_POSTGIS=true in .env');
  }

  /**
   * Calculate accurate perimeter using PostGIS ST_Length
   * 
   * ST_Length returns length in meters for geographic types
   * Divide by 1000 to get kilometers
   */
  static async calculatePerimeterPostGIS(geoJSON: string): Promise<number> {
    /*
    try {
      const result = await sequelize.query(`
        SELECT ST_Length(ST_GeomFromGeoJSON($1)::geography) / 1000 as perimeter_km
      `, {
        replacements: [geoJSON],
        type: QueryTypes.SELECT,
      });

      if (result.length === 0) return 0;
      return (result[0] as any).perimeter_km || 0;
    } catch (err) {
      throw new Error(`PostGIS perimeter calculation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    */
    throw new Error('PostGIS not enabled. Set USE_POSTGIS=true in .env');
  }

  /**
   * Validate GeoJSON geometry using PostGIS
   * 
   * ST_IsValid checks if geometry is topologically valid
   */
  static async validateGeometryPostGIS(geoJSON: string): Promise<boolean> {
    /*
    try {
      const result = await sequelize.query(`
        SELECT ST_IsValid(ST_GeomFromGeoJSON($1)) as is_valid
      `, {
        replacements: [geoJSON],
        type: QueryTypes.SELECT,
      });

      if (result.length === 0) return false;
      return (result[0] as any).is_valid === true;
    } catch (err) {
      console.error('PostGIS validation failed:', err);
      return false;
    }
    */
    throw new Error('PostGIS not enabled. Set USE_POSTGIS=true in .env');
  }

  /**
   * Find projects near a location
   * 
   * ST_DWithin finds all features within distance (in meters)
   * Useful for proximity-based queries
   */
  static async findProjectsNearby(latitude: number, longitude: number, radiusKm: number): Promise<string[]> {
    /*
    try {
      const radiusMeters = radiusKm * 1000;
      const result = await sequelize.query(`
        SELECT p.id
        FROM projects p
        JOIN project_gis pg ON p.id = pg.project_id
        WHERE ST_DWithin(
          ST_GeomFromGeoJSON(pg.boundary_geojson)::geography,
          ST_Point($1, $2)::geography,
          $3
        )
        ORDER BY ST_Distance(
          ST_GeomFromGeoJSON(pg.boundary_geojson)::geography,
          ST_Point($1, $2)::geography
        ) ASC
        LIMIT 50;
      `, {
        replacements: [longitude, latitude, radiusMeters],
        type: QueryTypes.SELECT,
      });

      return result.map((r: any) => r.id);
    } catch (err) {
      throw new Error(`PostGIS proximity search failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    */
    throw new Error('PostGIS not enabled. Set USE_POSTGIS=true in .env');
  }

  /**
   * Check if project boundaries overlap
   * 
   * ST_Intersects detects geometric overlaps
   */
  static async checkBoundaryOverlap(projectId1: string, projectId2: string): Promise<boolean> {
    /*
    try {
      const result = await sequelize.query(`
        SELECT ST_Intersects(
          (SELECT ST_GeomFromGeoJSON(boundary_geojson) FROM project_gis WHERE project_id = $1),
          (SELECT ST_GeomFromGeoJSON(boundary_geojson) FROM project_gis WHERE project_id = $2)
        ) as overlaps
      `, {
        replacements: [projectId1, projectId2],
        type: QueryTypes.SELECT,
      });

      if (result.length === 0) return false;
      return (result[0] as any).overlaps === true;
    } catch (err) {
      console.error('PostGIS overlap check failed:', err);
      return false;
    }
    */
    throw new Error('PostGIS not enabled. Set USE_POSTGIS=true in .env');
  }

  /**
   * Create a buffer zone around project boundary
   * 
   * ST_Buffer creates expanded geometry
   * Useful for conservation zones, protection areas
   */
  static async createProjectBuffer(projectId: string, bufferKm: number): Promise<string> {
    /*
    try {
      const bufferMeters = bufferKm * 1000;
      const result = await sequelize.query(`
        SELECT ST_AsGeoJSON(
          ST_Buffer(
            ST_GeomFromGeoJSON(boundary_geojson)::geography,
            $1
          )
        ) as buffered_geojson
        FROM project_gis
        WHERE project_id = $2
      `, {
        replacements: [bufferMeters, projectId],
        type: QueryTypes.SELECT,
      });

      if (result.length === 0) throw new Error('Project GIS data not found');
      return (result[0] as any).buffered_geojson;
    } catch (err) {
      throw new Error(`PostGIS buffer creation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    */
    throw new Error('PostGIS not enabled. Set USE_POSTGIS=true in .env');
  }

  /**
   * Calculate intersection area between two project boundaries
   * 
   * Useful for detecting overlapping project areas
   */
  static async calculateIntersectionArea(projectId1: string, projectId2: string): Promise<number> {
    /*
    try {
      const result = await sequelize.query(`
        SELECT ST_Area(
          ST_Intersection(
            ST_GeomFromGeoJSON((SELECT boundary_geojson FROM project_gis WHERE project_id = $1))::geography,
            ST_GeomFromGeoJSON((SELECT boundary_geojson FROM project_gis WHERE project_id = $2))::geography
          )
        ) / 10000 as intersection_area_ha
      `, {
        replacements: [projectId1, projectId2],
        type: QueryTypes.SELECT,
      });

      if (result.length === 0) return 0;
      return (result[0] as any).intersection_area_ha || 0;
    } catch (err) {
      console.error('PostGIS intersection calculation failed:', err);
      return 0;
    }
    */
    throw new Error('PostGIS not enabled. Set USE_POSTGIS=true in .env');
  }

  /**
   * Cluster nearby projects
   * 
   * ST_ClusterKMeans groups geometries by proximity
   * Useful for batch processing or regional analysis
   */
  static async clusterProjectsByProximity(radiusKm: number, maxClusters: number = 10): Promise<any[]> {
    /*
    try {
      const radiusMeters = radiusKm * 1000;
      const result = await sequelize.query(`
        WITH clustered AS (
          SELECT 
            pg.project_id,
            ST_ClusterKMeans(
              ST_GeomFromGeoJSON(pg.boundary_geojson)::geography,
              $1
            ) OVER () as cluster_id
          FROM project_gis pg
        )
        SELECT cluster_id, array_agg(project_id) as project_ids
        FROM clustered
        GROUP BY cluster_id
        ORDER BY cluster_id
        LIMIT $2
      `, {
        replacements: [maxClusters, maxClusters],
        type: QueryTypes.SELECT,
      });

      return result as any[];
    } catch (err) {
      throw new Error(`PostGIS clustering failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    */
    throw new Error('PostGIS not enabled. Set USE_POSTGIS=true in .env');
  }

  /**
   * Get project statistics within a region
   * 
   * Aggregates data for multiple projects in a bounding box
   */
  static async getRegionalStats(minLat: number, minLng: number, maxLat: number, maxLng: number): Promise<{
    projectCount: number;
    totalAreaHa: number;
    totalPerimeterKm: number;
  }> {
    /*
    try {
      const result = await sequelize.query(`
        SELECT 
          COUNT(DISTINCT p.id) as project_count,
          SUM(ST_Area(ST_GeomFromGeoJSON(pg.boundary_geojson)::geography)) / 10000 as total_area_ha,
          SUM(ST_Length(ST_GeomFromGeoJSON(pg.boundary_geojson)::geography)) / 1000 as total_perimeter_km
        FROM projects p
        JOIN project_gis pg ON p.id = pg.project_id
        WHERE ST_Contains(
          ST_MakeEnvelope($1, $2, $3, $4, 4326),
          ST_GeomFromGeoJSON(pg.boundary_geojson)
        )
      `, {
        replacements: [minLng, minLat, maxLng, maxLat],
        type: QueryTypes.SELECT,
      });

      const row = result[0] as any;
      return {
        projectCount: row.project_count || 0,
        totalAreaHa: row.total_area_ha || 0,
        totalPerimeterKm: row.total_perimeter_km || 0,
      };
    } catch (err) {
      throw new Error(`PostGIS regional stats failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    */
    throw new Error('PostGIS not enabled. Set USE_POSTGIS=true in .env');
  }
}
