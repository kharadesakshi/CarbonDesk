# Caching Strategy Guide

## Overview

The Carbon Project Management Platform implements a **simple in-memory caching layer** for dashboard statistics and frequently accessed data. This reduces database load and improves API response times.

### Current Architecture

```
Request → Cache Check → Database (if miss) → Store in Cache → Response
```

**Cache TTL (Time-to-Live):** 5 minutes (configurable)

## When to Use Caching

### Use Caching For:
- **Dashboard statistics** — aggregated counts that don't need to be real-time
- **Rarely changing data** — project types, status enums, GIS boundaries
- **Expensive queries** — aggregates, JOINs, GROUP BY operations
- **High-traffic endpoints** — dashboard stats accessed by all users

### Don't Cache:
- **User-specific sensitive data** — auth tokens, personal preferences
- **Real-time data** — live document uploads, immediate counts
- **Data that changes frequently** — active participant status, document processing status

## Cache Service API

### Basic Operations

```typescript
import { CacheService } from '../services/cache/CacheService';

// Set value in cache
CacheService.set('key', value, { ttl: 5 * 60 * 1000 }); // 5 minutes

// Get value from cache
const value = CacheService.get('key');

// Check if key exists
if (CacheService.has('key')) {
  // ...
}

// Delete key
CacheService.delete('key');

// Delete multiple keys by pattern
CacheService.deletePattern('dashboard_.*');

// Clear all cache
CacheService.clear();

// Get cache statistics
const stats = CacheService.getStats();
console.log(`Cache size: ${stats.size}`);
```

### Get-or-Set Pattern

The most useful pattern for caching database queries:

```typescript
const stats = await CacheService.getOrSet(
  'dashboard_stats_user123',
  async () => {
    // This loader only runs if not in cache
    return await expensiveQueryFunction();
  },
  { ttl: 5 * 60 * 1000 }
);
```

## Dashboard Caching

### Phase 4.2 Implementation

The dashboard service aggregates statistics from multiple tables:

```
GET /api/dashboard/stats
├─ Project counts (total, active, completed, archived)
├─ Participant counts (total, active, inactive)
├─ Document counts (total, by type)
├─ GIS stats (projects with boundary, total area)
└─ Recent activity
```

**Before Caching:**
```
1 request = 8 database queries (for 1000 users = 8000 queries/sec)
Response time: ~200ms
```

**After Caching (5-min TTL):**
```
1 request (cache hit) = 0 database queries
Response time: ~5ms

1 request (cache miss) = 8 database queries (cached for 5 min)
Average with 1000 concurrent users = ~26 queries/sec (vs 8000)
```

### Cache Invalidation

Cache is automatically invalidated when data changes:

```typescript
// In project.controller.ts
export async function createProject(req: Request, res: Response) {
  const project = await Project.create(data);
  
  // Invalidate cache for this developer
  DashboardService.invalidateForDeveloper(developerId);
  
  res.status(201).json({ data: project });
}
```

**Invalidation Triggers:**
- Create project → clears `dashboard_stats_${developerId}`
- Update project → clears `dashboard_stats_${developerId}`
- Delete project → clears `dashboard_stats_${developerId}`
- Create participant → clears `dashboard_stats_${developerId}`
- Update participant → clears `dashboard_stats_${developerId}`
- Delete participant → clears `dashboard_stats_${developerId}`
- Upload document → clears `dashboard_stats_${developerId}`
- Delete document → clears `dashboard_stats_${developerId}`

## Usage Examples

### Dashboard Stats Endpoint

```typescript
// GET /api/dashboard/stats
// Returns cached stats (or fresh if cache miss)

const response = await fetch('/api/dashboard/stats', {
  headers: { Authorization: `Bearer ${token}` }
});

const { data, cached } = await response.json();
// data: { projects, participants, documents, gis, recentActivity }
// cached: boolean indicating if response was from cache
```

### Cache Monitoring

```typescript
// GET /api/dashboard/cache
// Admin endpoint to check cache status

const response = await fetch('/api/dashboard/cache', {
  headers: { Authorization: `Bearer ${token}` }
});

const { data } = await response.json();
console.log(`Cache size: ${data.size}`);
console.log(data.entries);
// [
//   { key: 'dashboard_stats_user1', expiresIn: 298000 },
//   { key: 'dashboard_stats_user2', expiresIn: 245000 },
// ]
```

### Clear Cache

```typescript
// DELETE /api/dashboard/cache
// Force clear all cached data

const response = await fetch('/api/dashboard/cache', {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${token}` }
});

const { message } = await response.json();
// "Cache cleared."
```

## Cache Cleanup

Background cleanup runs every 60 seconds to remove expired entries:

```typescript
// In app.ts (auto-started)
CacheService.startCleanup();

// Cleanup logs
[CACHE] Cleanup started (interval: 60s)
[CACHE] Cleanup: removed 15 expired entries
```

## Memory Considerations

### Current Limits

- **Per Entry:** ~1-5 KB (dashboard stats)
- **Max Cache Size:** Limited only by Node.js heap memory
- **Default Heap:** 512 MB (varies by environment)

### Estimation

```
Assuming 1000 active users
- Per-user cache size: ~3 KB
- Total cached data: ~3 MB
- Memory overhead: <1% of 512 MB
```

### Monitor Memory Usage

```typescript
import { performance } from 'perf_hooks';

const stats = CacheService.getStats();
console.log(`Cache entries: ${stats.size}`);

// Node.js memory usage
const usage = process.memoryUsage();
console.log(`Heap used: ${usage.heapUsed / 1024 / 1024} MB`);
console.log(`Heap total: ${usage.heapTotal / 1024 / 1024} MB`);
```

## Production Deployment

### Single Server

For single-server deployments, in-memory cache is ideal:
- ✅ Fast (millisecond access)
- ✅ No external dependencies
- ✅ Simple to reason about
- ⚠️ Invalidated on server restart

### Multi-Server (Load Balanced)

For multiple servers, in-memory cache causes issues:
- ❌ Cache not shared across servers
- ❌ Different users see different data
- ❌ Invalidation doesn't propagate

**Solution: Use Redis**

Migration to Redis:

```typescript
// Install: npm install redis

import { createClient } from 'redis';

const redisClient = createClient({ host: 'redis-server', port: 6379 });

export class CacheService {
  static async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 5 * 60 * 1000;
    await redisClient.setEx(key, ttl / 1000, JSON.stringify(value));
  }

  static async get<T>(key: string): Promise<T | null> {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  // ... other methods
}
```

Set `REDIS_URL` in `.env`:
```
REDIS_URL=redis://redis-server:6379
```

## Performance Benchmarks

### Dashboard Stats Query

**Without Cache:**
```
Query Time: ~150-200ms
Database Queries: 8
```

**With Cache (Hit):**
```
Query Time: ~5ms
Database Queries: 0
Improvement: 30x faster
```

**With Cache (Miss):**
```
Query Time: ~150-200ms
Database Queries: 8
(First request, cached for next 5 min)
```

### Estimated Impact (1000 users)

```
Without Cache:
- 8000 queries/sec (if all users hit endpoint simultaneously)
- 200ms response time
- High database load

With Cache (5-min TTL):
- ~26 queries/sec average (8 queries every 5 min per user)
- 5-195ms response time (mostly 5ms after first request)
- 99.7% fewer database queries
- Sustained database load
```

## Best Practices

### 1. Use Appropriate TTL

```typescript
// Fast-changing data: 1 minute
CacheService.set('participant_status', data, { ttl: 60 * 1000 });

// Stable data: 30 minutes
CacheService.set('project_types', data, { ttl: 30 * 60 * 1000 });

// Real-time data: No cache
// (or use very short TTL like 5 seconds)
```

### 2. Invalidate on Write

```typescript
// ❌ Bad: Cache becomes stale
await participant.update({ status: 'active' });
// Cache still has old data!

// ✅ Good: Invalidate on write
await participant.update({ status: 'active' });
CacheService.invalidateParticipants(projectId);
```

### 3. Use Meaningful Keys

```typescript
// ❌ Bad: Non-obvious key
CacheService.set('data123', value);

// ✅ Good: Descriptive key
CacheService.set('dashboard_stats_user123', value);
CacheService.set('participants_project456_page2', value);
CacheService.set('documents_count_pdf', value);
```

### 4. Cache Aggregates, Not Details

```typescript
// ❌ Bad: Cache every participant
const participants = await Participant.findAll();
CacheService.set('all_participants', participants);

// ✅ Good: Cache aggregates
const count = await Participant.count();
CacheService.set('participant_count', count);
```

### 5. Log Cache Activity

```typescript
// Use console.log for cache operations
[CACHE] Set: dashboard_stats_user1 (expires in 300s)
[CACHE] Hit: dashboard_stats_user1
[CACHE] Miss: dashboard_stats_user2, loading...
[CACHE] Deleted: dashboard_stats_user3
[CACHE] Cleanup: removed 5 expired entries
```

## Troubleshooting

### Cache Not Invalidating

**Problem:** Data changed but cache shows old values.

**Solution:**
```typescript
// Ensure invalidation happens after update
await project.update({ name: 'New Name' });
DashboardService.invalidateForDeveloper(developerId);  // ← Must come after
```

### Memory Growing

**Problem:** `process.memoryUsage().heapUsed` keeps increasing.

**Solution:**
```typescript
// Check cache size
const stats = CacheService.getStats();
if (stats.size > 10000) {
  console.warn('Cache size exceeding normal');
  CacheService.clear();
}

// Reduce TTL
CacheService.set('key', value, { ttl: 60 * 1000 }); // 1 min instead of 5
```

### Cache Works in Dev, Not Production

**Problem:** Single-server cache doesn't work with load balancer.

**Solution:** Migrate to Redis (see "Multi-Server" section above).

## References

- [Cache Strategy Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
- [TTL Best Practices](https://en.wikipedia.org/wiki/Time_to_live)
- [Redis Quick Start](https://redis.io/docs/manual/client-side-caching/)
- [Node.js Memory Management](https://nodejs.org/en/docs/guides/simple-profiling/)
