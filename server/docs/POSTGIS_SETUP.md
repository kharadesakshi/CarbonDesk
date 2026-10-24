# PostGIS Setup Guide

## Overview

PostGIS is an optional advanced geographic extension for PostgreSQL. The Carbon Project Management Platform currently uses **turf.js** for geographic calculations, which is sufficient for the MVP. PostGIS can be enabled in the future when:

- Scale: >10,000 projects with complex boundaries
- Performance: Need spatial indexing for sub-second queries
- Features: Advanced spatial analysis (clustering, regional statistics, raster data)

## Current Architecture

**Phase 2.2 (MVP):** turf.js + pure PostgreSQL
- ✓ Accurate area/perimeter calculations
- ✓ Polygon validation
- ✓ Point-in-polygon queries
- ✓ Buffer and centroid calculations
- No additional database extension required

**Phase 2.3 (Future):** PostGIS optional adapter
- Documented in `server/src/services/gis/PostGISAdapter.ts`
- Implementations commented out (zero runtime overhead)
- Ready to uncomment and enable when needed

## When to Migrate to PostGIS

### Indicators to Migrate

1. **Scale:** >1M GIS queries/month
2. **Complexity:** Need proximity-based queries across thousands of projects
3. **Performance:** Need sub-100ms response on regional queries
4. **Features:** Require raster data (satellite imagery), advanced clustering

### Do NOT migrate if:

- Currently <1M queries/month
- Queries complete in <500ms with turf.js
- No need for spatial indexing
- PostgreSQL extension installation not available

## Installation (PostgreSQL 12+)

### 1. Install PostGIS Extension (Database Admin)

```bash
# Connect to your database
psql -U postgres -d carbon_cpms_db

# Install PostGIS extension
CREATE EXTENSION postgis;

# Verify installation
SELECT postgis_version();
```

### 2. Create Spatial Indexes (Performance)

```sql
-- Add geometry column (if not already present)
ALTER TABLE project_gis 
ADD COLUMN geom geometry(Polygon, 4326) GENERATED ALWAYS AS 
  (ST_GeomFromGeoJSON(boundary_geojson)) STORED;

-- Create spatial index for fast queries
CREATE INDEX idx_project_gis_geom ON project_gis USING GIST (geom);

-- Create index on project boundaries for proximity searches
CREATE INDEX idx_project_gis_boundary ON project_gis 
  USING GIST (ST_GeomFromGeoJSON(boundary_geojson)::geography);
```

### 3. Enable in Application

```bash
# Set environment variable
echo "USE_POSTGIS=true" >> .env
```

### 4. Uncomment PostGIS Adapter

In `server/src/services/gis/PostGISAdapter.ts`, uncomment the method implementations:

```typescript
// Before: throws error
static async calculateAreaPostGIS(geoJSON: string): Promise<number> {
  throw new Error('PostGIS not enabled...');
}

// After: executes PostGIS query
static async calculateAreaPostGIS(geoJSON: string): Promise<number> {
  const result = await sequelize.query(`
    SELECT ST_Area(ST_GeomFromGeoJSON($1)::geography) / 10000 as area_ha
  `, { replacements: [geoJSON] });
  // ... return result
}
```

## Available PostGIS Methods

### Calculations

| Method | Use Case | Performance |
|--------|----------|-------------|
| `calculateAreaPostGIS()` | Accurate area in hectares | Indexed: <10ms, Unindexed: <100ms |
| `calculatePerimeterPostGIS()` | Accurate perimeter in km | Same as area |
| `validateGeometryPostGIS()` | Check topology validity | <5ms |

### Spatial Queries

| Method | Use Case | Performance |
|--------|----------|-------------|
| `findProjectsNearby()` | Proximity search | With index: <50ms |
| `checkBoundaryOverlap()` | Detect overlaps | With index: <50ms |
| `calculateIntersectionArea()` | Overlap analysis | With index: <100ms |

### Advanced Operations

| Method | Use Case | Performance |
|--------|----------|-------------|
| `createProjectBuffer()` | Create protection zones | <100ms |
| `clusterProjectsByProximity()` | Group nearby projects | <500ms (depends on count) |
| `getRegionalStats()` | Aggregate statistics | With index: <200ms |

## Migration Path

### Step 1: Testing (Dev Environment)

```bash
# 1. Install PostGIS in dev database
# 2. Set USE_POSTGIS=true
# 3. Run integration tests with PostGIS methods
npm run test:integration
```

### Step 2: Validation (Production Database)

```bash
# 1. Create PostGIS backup
pg_dump carbon_cpms_db > backup_pre_postgis.sql

# 2. Install PostGIS extension
CREATE EXTENSION postgis;

# 3. Create spatial indexes
# (see "Create Spatial Indexes" section above)

# 4. Validate no data loss
SELECT COUNT(*) FROM project_gis;
```

### Step 3: Deploy (Production)

```bash
# 1. Set USE_POSTGIS=true in production .env
# 2. Deploy application
# 3. Monitor query performance
# 4. Gradually enable PostGIS methods in GISService
```

## Performance Comparison

### Area Calculation (10,000 projects)

| Method | Time | Accuracy |
|--------|------|----------|
| turf.js (MVP) | 50ms (total) | ±0.01% |
| PostGIS (Indexed) | 5-50ms (per query) | ±0.0001% |

**Verdict:** PostGIS faster for large queries, turf.js sufficient for MVP.

### Proximity Search (10,000 projects)

| Method | Time | Scalability |
|--------|------|-------------|
| turf.js (scan all) | 500-1000ms | O(n) — doesn't scale |
| PostGIS (indexed) | 50-100ms | O(log n) — scales well |

**Verdict:** PostGIS essential for proximity queries at scale.

## Troubleshooting

### "CREATE EXTENSION postgis failed"

**Problem:** PostgreSQL cluster doesn't have PostGIS package installed.

**Solution:**
```bash
# macOS
brew install postgis

# Ubuntu/Debian
sudo apt-get install postgresql-12-postgis-3

# Restart PostgreSQL and retry CREATE EXTENSION
```

### "Geometry column too large"

**Problem:** Saving very complex polygons (>10k vertices) crashes PostGIS.

**Solution:**
```sql
-- Simplify geometry (reduce vertices by 10%)
SELECT ST_Simplify(geom, 0.001) FROM project_gis;

-- Or split into multi-polygon regions
SELECT ST_AsGeoJSON(ST_Subdivide(geom, 256)) FROM project_gis;
```

### "Query too slow on large dataset"

**Problem:** Missing spatial indexes.

**Solution:**
```bash
# Analyze index usage
EXPLAIN ANALYZE
  SELECT * FROM project_gis WHERE ST_Contains(geom, ST_Point(...));

# If missing index, create it (see section above)
CREATE INDEX idx_project_gis_geom ON project_gis USING GIST (geom);
```

## Reverting from PostGIS (If Needed)

If PostGIS causes issues, revert to turf.js:

```bash
# 1. Set environment variable
echo "USE_POSTGIS=false" >> .env

# 2. Restart application (turf.js will be used)
npm run dev

# 3. Optional: Remove PostGIS extension from database
# DROP EXTENSION postgis CASCADE;
```

## Additional Resources

- [PostGIS Documentation](https://postgis.net/documentation/)
- [PostGIS Performance Tuning](https://postgis.net/workshops/postgis-intro/tuning.html)
- [turf.js Documentation](https://turfjs.org/)
- [Spatial Indexing Guide](https://en.wikipedia.org/wiki/Spatial_database#Spatial_index)

## Support

For issues with PostGIS setup:
1. Check PostgreSQL version: `SELECT version();`
2. Verify PostGIS: `SELECT postgis_version();`
3. Review application logs for GIS errors
4. Test isolated queries in psql before integrating
