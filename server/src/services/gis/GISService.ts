/**
 * GIS Service - Geographic calculations and validations
 * Uses turf.js for geographic measurements (area, perimeter, distance)
 * Designed to be compatible with PostGIS for future migration
 */

import * as turf from '@turf/turf';
import { Feature, FeatureCollection, Polygon, LineString, Point, MultiPolygon, Geometry, GeometryCollection } from 'geojson';

/**
 * GIS calculation results
 */
export interface GISMetrics {
  areaM2: number;           // Area in square meters
  areaHa: number;           // Area in hectares
  perimeterKm: number;      // Perimeter in kilometers
  coordCount: number;       // Number of vertices
  isValid: boolean;         // Whether geometry is valid
  validationMessage?: string;
  boundingBox?: {           // [minLng, minLat, maxLng, maxLat]
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  };
}

export class GISService {
  /**
   * Calculate comprehensive metrics for a GeoJSON feature
   */
  static calculateMetrics(geoJSON: string | object): GISMetrics {
    let feature: Feature;

    try {
      feature = typeof geoJSON === 'string' ? JSON.parse(geoJSON) : geoJSON;
    } catch (err) {
      throw new Error('Invalid GeoJSON: must be valid JSON');
    }

    // Validate feature structure
    if (!feature.geometry) {
      throw new Error('Invalid GeoJSON: missing geometry');
    }

    // Check if geometry has coordinates (exclude GeometryCollection)
    const geometry = feature.geometry;
    if (!('coordinates' in geometry)) {
      throw new Error('Invalid GeoJSON: geometry must have coordinates');
    }

    try {
      // Validate and process based on geometry type
      if (geometry.type === 'Polygon') {
        return this.calculatePolygonMetrics(feature as Feature<Polygon>);
      } else if (geometry.type === 'LineString') {
        return this.calculateLineStringMetrics(feature as Feature<LineString>);
      } else if (geometry.type === 'Point') {
        return this.calculatePointMetrics(feature as Feature<Point>);
      } else if (geometry.type === 'MultiPolygon') {
        return this.calculatePolygonMetrics(feature as Feature<MultiPolygon>);
      } else {
        throw new Error(`Unsupported geometry type: ${geometry.type}`);
      }
    } catch (err) {
      throw new Error(`Failed to calculate metrics: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate metrics for Polygon/MultiPolygon geometry
   */
  private static calculatePolygonMetrics(feature: Feature<Polygon | MultiPolygon>): GISMetrics {
    const coordinates = feature.geometry.coordinates;

    if (!Array.isArray(coordinates) || !coordinates[0] || !Array.isArray(coordinates[0])) {
      throw new Error('Invalid Polygon coordinates');
    }

    const ring = coordinates[0]; // Outer ring

    // Validate polygon has at least 4 points (3 unique + 1 closing)
    if (ring.length < 4) {
      throw new Error('Polygon must have at least 3 unique vertices');
    }

    // Validate polygon is closed
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      throw new Error('Polygon ring must be closed (first and last points must match)');
    }

    try {
      // Create a turf-compatible feature
      const turfFeature = turf.feature(feature.geometry);

      // Calculate area using turf.js
      const areaM2 = turf.area(turfFeature);
      const areaHa = areaM2 / 10000;

      // Calculate perimeter using turf.js
      const perimeterKm = turf.length(turfFeature);

      // Get bounding box
      const bbox = turf.bbox(turfFeature);

      // Validate area is reasonable (not negative, not infinitely large)
      if (areaM2 < 0 || !isFinite(areaM2)) {
        throw new Error('Invalid polygon area calculation');
      }

      // Warning: area should be < 50 million hectares (roughly Earth's land area)
      if (areaHa > 50_000_000) {
        console.warn(`[GIS] Area ${areaHa} ha is unusually large`);
      }

      return {
        areaM2,
        areaHa,
        perimeterKm,
        coordCount: ring.length - 1, // Exclude closing point
        isValid: true,
        boundingBox: {
          minLng: bbox[0],
          minLat: bbox[1],
          maxLng: bbox[2],
          maxLat: bbox[3],
        },
      };
    } catch (err) {
      throw new Error(`Polygon calculation error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate metrics for LineString geometry
   */
  private static calculateLineStringMetrics(feature: Feature<LineString>): GISMetrics {
    const coordinates = feature.geometry.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      throw new Error('LineString must have at least 2 points');
    }

    try {
      // Create a turf-compatible feature
      const turfFeature = turf.feature(feature.geometry);
      
      const lengthKm = turf.length(turfFeature);
      const bbox = turf.bbox(turfFeature);

      return {
        areaM2: 0,
        areaHa: 0,
        perimeterKm: lengthKm,
        coordCount: coordinates.length,
        isValid: true,
        boundingBox: {
          minLng: bbox[0],
          minLat: bbox[1],
          maxLng: bbox[2],
          maxLat: bbox[3],
        },
      };
    } catch (err) {
      throw new Error(`LineString calculation error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate metrics for Point geometry
   */
  private static calculatePointMetrics(feature: Feature<Point>): GISMetrics {
    const coordinates = feature.geometry.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      throw new Error('Point must have exactly 2 coordinates [lng, lat]');
    }

    const [lng, lat] = coordinates;

    if (typeof lng !== 'number' || typeof lat !== 'number') {
      throw new Error('Point coordinates must be numbers');
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Point coordinates out of valid range');
    }

    return {
      areaM2: 0,
      areaHa: 0,
      perimeterKm: 0,
      coordCount: 1,
      isValid: true,
      boundingBox: {
        minLng: lng,
        minLat: lat,
        maxLng: lng,
        maxLat: lat,
      },
    };
  }

  /**
   * Validate coordinate is within valid bounds
   */
  static validateCoordinate(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  /**
   * Calculate distance between two points in kilometers
   */
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const from = turf.point([lng1, lat1]);
    const to = turf.point([lng2, lat2]);
    return turf.distance(from, to);
  }

  /**
   * Check if point is within polygon
   */
  static isPointInPolygon(lat: number, lng: number, polygonGeoJSON: string | object): boolean {
    try {
      let polygon = typeof polygonGeoJSON === 'string' ? JSON.parse(polygonGeoJSON) : polygonGeoJSON;
      const point = turf.point([lng, lat]);

      // If polygon is Feature, extract the geometry
      if (polygon.type === 'Feature') {
        polygon = polygon.geometry;
      }

      return turf.booleanPointInPolygon(point, turf.feature(polygon));
    } catch (err) {
      throw new Error(`Point-in-polygon check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a buffer around a geometry
   * @param geoJSON GeoJSON feature or string
   * @param bufferKm Buffer distance in kilometers
   */
  static createBuffer(geoJSON: string | object, bufferKm: number): Feature {
    try {
      let feature = typeof geoJSON === 'string' ? JSON.parse(geoJSON) : geoJSON;

      // If it's a Feature, use it directly; otherwise create one
      if (feature.type !== 'Feature') {
        feature = turf.feature(feature);
      }

      // Ensure we have a valid geometry type for buffer
      const geometryType = feature.geometry.type;
      if (!['Polygon', 'MultiPolygon', 'LineString', 'Point'].includes(geometryType)) {
        throw new Error(`Unsupported geometry type for buffer: ${geometryType}`);
      }

      const result = turf.buffer(feature, bufferKm, { units: 'kilometers' });
      
      // Ensure we return a Feature, not a FeatureCollection
      if (result.type === 'FeatureCollection') {
        // If buffer returns a FeatureCollection, merge it into a single Feature
        // or take the first feature
        if (result.features && result.features.length > 0) {
          return result.features[0] as Feature;
        }
        throw new Error('Buffer operation returned empty FeatureCollection');
      }
      
      return result as Feature;
    } catch (err) {
      throw new Error(`Buffer creation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate centroid of a geometry
   */
  static calculateCentroid(geoJSON: string | object): { lat: number; lng: number } {
    try {
      let feature = typeof geoJSON === 'string' ? JSON.parse(geoJSON) : geoJSON;

      const centroid = turf.centroid(feature);
      const [lng, lat] = centroid.geometry.coordinates;

      return { lat, lng };
    } catch (err) {
      throw new Error(`Centroid calculation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if two geometries intersect
   */
  static geometriesIntersect(geoJSON1: string | object, geoJSON2: string | object): boolean {
    try {
      let feature1 = typeof geoJSON1 === 'string' ? JSON.parse(geoJSON1) : geoJSON1;
      let feature2 = typeof geoJSON2 === 'string' ? JSON.parse(geoJSON2) : geoJSON2;

      // Ensure they're Features
      if (feature1.type !== 'Feature') {
        feature1 = turf.feature(feature1);
      }
      if (feature2.type !== 'Feature') {
        feature2 = turf.feature(feature2);
      }

      return turf.booleanIntersects(feature1, feature2);
    } catch (err) {
      throw new Error(`Intersection check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
}