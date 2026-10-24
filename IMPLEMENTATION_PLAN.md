# Carbon Project Management Platform - Implementation Plan

**Created**: August 21, 2026  
**Status**: Planning Phase  
**Goal**: Complete the platform per master prompt requirements

---

## Executive Summary

Your platform is **85% complete** with solid foundations. This plan addresses the remaining 15% and ensures production readiness.

### Current State
✅ Authentication (JWT + bcrypt)  
✅ Projects CRUD with pagination, search, filtering  
✅ Participants CRUD with project association  
✅ Document upload (local storage)  
✅ GIS boundaries (storage, basic visualization)  
✅ Dashboard with real statistics  
✅ Protected routes (frontend & backend)  
✅ TypeScript strict mode throughout  
✅ Sequelize ORM with migrations  
✅ All 11 frontend pages  

### Gaps to Address
⚠️ Document download/verification endpoints  
⚠️ S3 storage provider integration  
⚠️ Advanced GIS drawing tools  
⚠️ Production deployment setup  
⚠️ Performance optimization  
⚠️ Comprehensive testing  

---

## Implementation Roadmap

### Phase 1: Document Management Complete (Priority: CRITICAL)

**Why First**: Documents are central to the workflow. Users must upload AND download.

#### 1.1 Backend: Document Download Endpoint

**File**: `server/src/controllers/document.controller.ts`

Add:
```typescript
export async function downloadDocument(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const developerId = req.developer!.developerId;
  
  const doc = await Document.findByPk(id);
  if (!doc) throw new AppError('Document not found', 404);
  
  // Verify ownership through project
  const project = await Project.findOne({
    where: { id: doc.projectId, developerId }
  });
  if (!project) throw new AppError('Access denied', 403);
  
  // Get download URL from storage provider
  const storage = getStorageProvider();
  const downloadUrl = await storage.getDownloadUrl(doc.storagePath);
  
  res.json({ data: { ...doc.toJSON(), downloadUrl } });
}
```

**File**: `server/src/routes/document.routes.ts`

Add:
```typescript
router.get('/:id/download', authenticate, downloadDocument);
```

#### 1.2 Backend: S3 Storage Provider

**File**: `server/src/services/storage/S3StorageProvider.ts` (CREATE)

```typescript
import AWS from 'aws-sdk';
import { StorageProvider } from './StorageService';

export class S3StorageProvider implements StorageProvider {
  private s3: AWS.S3;
  
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }
  
  async upload(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string
  ): Promise<{ storagePath: string; storageProvider: string }> {
    // Generate safe filename with UUID
    const timestamp = Date.now();
    const safeFileName = `${timestamp}-${this.sanitizeFilename(originalName)}`;
    const storagePath = `${folder}/${safeFileName}`;
    
    await this.s3.putObject({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: storagePath,
      Body: fileBuffer,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
    }).promise();
    
    return { storagePath, storageProvider: 's3' };
  }
  
  async delete(storagePath: string): Promise<void> {
    await this.s3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: storagePath,
    }).promise();
  }
  
  async getDownloadUrl(storagePath: string): Promise<string> {
    // Generate signed URL valid for 1 hour
    return this.s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: storagePath,
      Expires: 3600,
    });
  }
  
  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  }
}
```

**File**: `server/src/services/storage/StorageService.ts` (UPDATE)

Update to return `StorageProvider` instance based on `STORAGE_PROVIDER` environment variable.

#### 1.3 Frontend: Document Download

**File**: `frontend/src/services/document.service.ts`

Add:
```typescript
export async function getDocumentDownload(id: string): Promise<string> {
  const response = await api.get(`/documents/${id}/download`);
  return response.data.data.downloadUrl;
}
```

**File**: `frontend/src/pages/DocumentsPage.tsx` (UPDATE)

Add download button linking to the download URL.

---

### Phase 2: Advanced GIS Implementation (Priority: HIGH)

**Why**: GIS is a core feature per master prompt. Current implementation is basic.

#### 2.1 Mapbox GL Draw Integration

**File**: `frontend/src/pages/GISPage.tsx` (COMPLETE REWRITE)

```typescript
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

export function GISPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [gis?.centerLongitude || 0, gis?.centerLatitude || 0],
      zoom: gis?.mapZoom || 10,
    });
    
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
    });
    
    map.current.addControl(draw.current);
    
    // Load existing boundary if available
    if (gis?.boundaryGeoJSON) {
      const geojson = JSON.parse(gis.boundaryGeoJSON);
      draw.current.set(geojson);
    }
  }, []);
  
  const handleSave = async () => {
    const geometry = draw.current.getAll();
    if (!geometry.features.length) {
      alert('Please draw a project boundary');
      return;
    }
    
    const feature = geometry.features[0];
    
    // Calculate area using turf.js
    const area = turf.area(feature); // in m²
    const areaHa = area / 10000; // convert to hectares
    
    await saveProjectGIS(projectId, {
      centerLatitude: map.current!.getCenter().lat,
      centerLongitude: map.current!.getCenter().lng,
      boundaryGeoJSON: JSON.stringify(feature),
      calculatedAreaHa: areaHa,
      mapZoom: map.current!.getZoom(),
    });
    
    alert('GIS data saved successfully');
  };
  
  return (
    <AppShell>
      {/* Map container */}
      <div ref={mapContainer} style={{ height: '600px' }} />
      
      {/* Controls sidebar */}
      <div className="controls">
        <button onClick={handleSave}>Save Boundary</button>
        <div className="area-display">
          Area: {gis?.calculatedAreaHa?.toFixed(2)} ha
        </div>
      </div>
    </AppShell>
  );
}
```

#### 2.2 Backend: Area Calculation Accuracy

**File**: `server/src/services/gis/GISService.ts` (CREATE)

Use PostGIS for accurate calculations:

```typescript
export async function calculateGeoJSONArea(geojson: string): Promise<number> {
  const feature = JSON.parse(geojson);
  
  // If PostGIS available, use it
  if (process.env.USE_POSTGIS === 'true') {
    // Query: SELECT ST_Area(ST_GeomFromGeoJSON(...)::geography) / 10000 as hectares
    // This returns accurate geographic area in hectares
  }
  
  // Otherwise use turf.js (frontend sends calculated area)
  // Backend validates that area is reasonable (> 0, < 1,000,000 ha)
  
  return feature.area || 0;
}
```

---

### Phase 3: Production Readiness (Priority: HIGH)

#### 3.1 Environment Variables & Validation

**File**: `server/src/utils/env.ts` (CREATE)

```typescript
function validateEnv() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'CORS_ORIGIN',
    'STORAGE_PROVIDER',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required env variables: ${missing.join(', ')}`);
  }
  
  if (process.env.JWT_SECRET!.length < 32) {
    console.warn('⚠️  JWT_SECRET should be at least 32 characters');
  }
  
  if (process.env.STORAGE_PROVIDER === 's3') {
    const s3Required = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'];
    const s3Missing = s3Required.filter(key => !process.env[key]);
    if (s3Missing.length > 0) {
      throw new Error(`S3 storage requires: ${s3Missing.join(', ')}`);
    }
  }
}
```

#### 3.2 Error Handling & Logging

**File**: `server/src/middleware/errorHandler.ts` (UPDATE)

```typescript
// Distinguish between operational and programming errors
// Log programming errors but don't expose to client
// Expose operational errors with appropriate status codes

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    // Operational error
    res.status(err.statusCode).json({ error: err.message });
  } else if (err instanceof ZodError) {
    // Validation error
    res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map(i => `${i.path.join('.')}: ${i.message}`),
    });
  } else {
    // Programming error - don't expose details
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### 3.3 File Upload Security

**File**: `server/src/middleware/fileValidator.ts` (CREATE)

```typescript
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.ms-excel',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function fileValidator(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    return next();
  }
  
  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    throw new AppError('File type not allowed', 400);
  }
  
  if (req.file.size > MAX_FILE_SIZE) {
    throw new AppError('File too large (max 10MB)', 400);
  }
  
  next();
}
```

---

### Phase 4: Performance Optimization (Priority: MEDIUM)

#### 4.1 Database Query Optimization

**File**: `server/src/controllers/participant.controller.ts` (UPDATE)

Replace N+1 query with batch query:

```typescript
// BEFORE (N+1):
const docs = await Document.findAll({ where: { participantId: ids } });

// AFTER (optimized):
const [participants, docs] = await Promise.all([
  Participant.findAll({ where: { projectId } }),
  Document.findAll({ where: { projectId } }),
]);

const docsByParticipant = docs.reduce((acc, doc) => {
  if (!acc[doc.participantId]) acc[doc.participantId] = [];
  acc[doc.participantId].push(doc);
  return acc;
}, {});

return participants.map(p => ({
  ...p.toJSON(),
  documentCount: docsByParticipant[p.id]?.length || 0,
}));
```

#### 4.2 Caching Strategy

**File**: `server/src/services/cache.ts` (CREATE)

```typescript
// Simple in-memory cache for dashboard stats (TTL: 5 minutes)
export class Cache {
  private store = new Map();
  private ttl = new Map();
  
  set(key: string, value: any, ttlMs = 5 * 60 * 1000) {
    this.store.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
  }
  
  get(key: string) {
    if (this.ttl.get(key) < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return this.store.get(key);
  }
}
```

---

### Phase 5: Testing & Documentation (Priority: MEDIUM)

#### 5.1 API Testing

**File**: `server/__tests__/api.test.ts` (CREATE)

```typescript
import request from 'supertest';
import app from '../src/app';

describe('Projects API', () => {
  let token: string;
  let projectId: string;
  
  beforeAll(async () => {
    // Register and login
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!',
        fullName: 'Test Developer',
      });
    token = res.body.data.token;
  });
  
  test('POST /api/projects creates a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Project',
        projectType: 'REDD+',
        description: 'Test description',
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    projectId = res.body.data.id;
  });
  
  test('GET /api/projects/:id retrieves project', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Test Project');
  });
});
```

#### 5.2 Frontend Component Testing

**File**: `frontend/__tests__/ProjectsPage.test.tsx` (CREATE)

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { ProjectsPage } from '../src/pages/ProjectsPage';
import * as projectService from '../src/services/project.service';

jest.mock('../src/services/project.service');

describe('ProjectsPage', () => {
  test('renders projects list', async () => {
    (projectService.listProjects as jest.Mock).mockResolvedValue({
      data: [
        { id: '1', name: 'Project 1', status: 'active' },
      ],
    });
    
    render(<ProjectsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });
  });
});
```

---

### Phase 6: Deployment Configuration (Priority: MEDIUM)

#### 6.1 Docker Setup

**File**: `Dockerfile` (CREATE)

```dockerfile
# Frontend build
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Backend
FROM node:18-alpine
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./
COPY --from=frontend-builder /app/frontend/dist /app/public

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

#### 6.2 Environment Configuration

**File**: `.env.production` (CREATE)

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/carbon_prod
JWT_SECRET=<min-32-chars-random>
CORS_ORIGIN=https://yourdomain.com
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_S3_BUCKET=carbon-project-bucket
```

---

## Implementation Priority Matrix

| Phase | Feature | Priority | Effort | Impact |
|-------|---------|----------|--------|--------|
| 1 | Document Download + S3 | CRITICAL | 3 days | HIGH - Core workflow blocker |
| 2 | Advanced GIS Tools | HIGH | 2 days | HIGH - Master prompt requirement |
| 3 | Env Validation + Error Handling | HIGH | 1 day | MEDIUM - Production readiness |
| 4 | Query Optimization | MEDIUM | 1 day | MEDIUM - Performance |
| 5 | Testing Suite | MEDIUM | 3 days | MEDIUM - Reliability |
| 6 | Deployment Setup | MEDIUM | 2 days | MEDIUM - Go-live readiness |

**Total Estimated Time**: 2 weeks

---

## Verification Checklist

After implementation, verify:

- [ ] Document download works with both local and S3 storage
- [ ] GIS boundary can be drawn, saved, and reloaded
- [ ] All files validated before upload
- [ ] Environment variables validated on startup
- [ ] Errors logged appropriately
- [ ] No N+1 queries in participant list
- [ ] Unauthorized users cannot access other developers' projects
- [ ] API tests pass (>90% coverage)
- [ ] Frontend builds without TypeScript errors
- [ ] Backend starts successfully in production mode
- [ ] Docker image builds and runs
- [ ] Database migrations run successfully

---

## Files to Create/Modify

### CREATE
- `server/src/services/storage/S3StorageProvider.ts`
- `server/src/services/gis/GISService.ts`
- `server/src/utils/env.ts`
- `server/src/middleware/fileValidator.ts`
- `server/src/services/cache.ts`
- `server/__tests__/api.test.ts`
- `frontend/__tests__/ProjectsPage.test.tsx`
- `Dockerfile`
- `.env.production`

### UPDATE
- `server/src/controllers/document.controller.ts` - Add download endpoint
- `server/src/routes/document.routes.ts` - Add download route
- `frontend/src/services/document.service.ts` - Add download method
- `frontend/src/pages/GISPage.tsx` - Integrate Mapbox Draw
- `frontend/src/pages/DocumentsPage.tsx` - Add download links
- `server/src/middleware/errorHandler.ts` - Improve error handling
- `server/src/controllers/participant.controller.ts` - Optimize queries
- Various files for env validation and testing

---

## Next Step

Ready to proceed with **Phase 1: Document Management Complete** to unblock core workflows?

Confirm and I'll start implementation immediately.
