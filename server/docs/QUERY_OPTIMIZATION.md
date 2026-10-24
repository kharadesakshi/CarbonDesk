# Query Optimization Guide

## N+1 Query Problem

The N+1 query problem occurs when fetching a list of items, then fetching related data in a loop:

### Before (N+1 Pattern)

```typescript
// ❌ BAD: N+1 queries
const participants = await Participant.findAll({ limit: 50 });  // 1 query
for (const p of participants) {
  const docCount = await Document.count({ where: { participantId: p.id } });  // 50 more queries
  // Total: 51 queries!
}
```

When listing 50 participants, this executes:
- 1 query to fetch participants
- 50 queries (1 per participant) to count documents
- **Total: 51 queries**

### After (Optimized)

```typescript
// ✅ GOOD: 1 query with JOIN and aggregate
const participants = await Participant.findAll({
  include: [{
    model: Document,
    attributes: [],  // Don't fetch data, just count
    required: false, // LEFT JOIN
  }],
  attributes: {
    include: [[fn('COUNT', col('Documents.id')), 'documentCount']],
  },
  group: ['Participant.id'],
  raw: true,
});
// Total: 1 query
```

When listing 50 participants:
- 1 query with LEFT JOIN and COUNT aggregate
- **Total: 1 query**

**Impact:** 50 database round-trips saved per request. With 100 concurrent users, that's 5,000 fewer queries/second.

## Sequelize Optimization Techniques

### 1. Eager Loading (include)

**Problem:** Lazy loading fetches related data only when accessed:

```typescript
// ❌ BAD: Lazy loading
const projects = await Project.findAll();
for (const p of projects) {
  console.log(p.developer);  // Triggers extra query per project
}
```

**Solution:** Use `include` to fetch related data upfront:

```typescript
// ✅ GOOD: Eager loading
const projects = await Project.findAll({
  include: [{ model: Developer }],
});
// Projects and developers fetched in 1 query
```

### 2. Aggregate Functions with GROUP BY

**Problem:** Counting related records in a loop:

```typescript
// ❌ BAD: N+1 pattern
const participants = await Participant.findAll();
const enriched = participants.map(p => ({
  ...p,
  documentCount: await Document.count({ participantId: p.id }),
}));
```

**Solution:** Use COUNT aggregate with include:

```typescript
// ✅ GOOD: 1 query with COUNT
import { fn, col } from 'sequelize';

const participants = await Participant.findAll({
  include: [{
    model: Document,
    attributes: [],
    required: false,
  }],
  attributes: {
    include: [[fn('COUNT', col('Documents.id')), 'documentCount']],
  },
  group: ['Participant.id'],
  raw: true,
});
```

### 3. Selective Attributes

**Problem:** Fetching unnecessary columns wastes bandwidth:

```typescript
// ❌ BAD: Fetches all columns
const participants = await Participant.findAll();
```

**Solution:** Select only needed columns:

```typescript
// ✅ GOOD: Fetch only needed columns
const participants = await Participant.findAll({
  attributes: ['id', 'fullName', 'email'],
});
```

### 4. Batch Operations

**Problem:** Updating records one-by-one:

```typescript
// ❌ BAD: N update queries
for (const participantId of ids) {
  await Participant.update({ status: 'active' }, { where: { id: participantId } });
}
```

**Solution:** Use batch update:

```typescript
// ✅ GOOD: 1 update query
await Participant.update(
  { status: 'active' },
  { where: { id: ids } }
);
```

### 5. Lazy vs Eager Loading Context

Use **lazy loading** (no include) when:
- Fetching single record by ID (avoids unnecessary JOINs)
- Related data might not be used

Use **eager loading** (include) when:
- Fetching multiple records and always using related data
- Building API response that includes related data

## Carbon Project Optimizations

### Participants List (Phase 4.1 Completed)

**Before:**
- 1 query: Get participants
- 1 query: Get all documents for those participants
- Manual loop to build count map
- **Total: 2 queries + manual processing**

**After:**
```typescript
await Participant.findAll({
  include: [{
    model: Document,
    attributes: [],
    required: false,
  }],
  attributes: {
    include: [[fn('COUNT', col('Documents.id')), 'documentCount']],
  },
  group: ['Participant.id'],
  raw: true,
});
// Total: 1 query
```

### Dashboard Stats (Phase 4.2)

The dashboard typically queries:
- Total projects
- Total participants
- Total documents
- Recent activity

**Without caching:**
```typescript
// ❌ BAD: 4 queries on every dashboard load
const projectCount = await Project.count();
const participantCount = await Participant.count();
const documentCount = await Document.count();
const recentDocs = await Document.findAll({ limit: 10 });
```

**With caching (5-minute TTL):**
```typescript
// ✅ GOOD: Cache results
if (!cache.has('dashboard_stats') || cache.isExpired('dashboard_stats')) {
  const stats = {
    projects: await Project.count(),
    participants: await Participant.count(),
    documents: await Document.count(),
    recent: await Document.findAll({ limit: 10 }),
  };
  cache.set('dashboard_stats', stats, { ttl: 5 * 60 * 1000 });
}
```

## Query Analysis

### Enable Query Logging

In development, log all queries to identify N+1 patterns:

```typescript
// In config/database.ts
const sequelize = new Sequelize(DATABASE_URL, {
  logging: process.env.SQL_LOG === 'true' ? console.log : false,
  // ... other config
});
```

Run with:
```bash
SQL_LOG=true npm run dev
```

### Analyze Query Performance

```sql
-- Enable query timing
EXPLAIN ANALYZE SELECT * FROM participants WHERE project_id = '123';

-- Look for:
-- - Sequential scans (slow, should use index)
-- - High planning/execution time
-- - Missing indexes
```

## Indexing Strategy

### Create Indexes for Common Queries

```sql
-- Foreign key indexes (speeds up JOINs)
CREATE INDEX idx_participant_project_id ON participants(project_id);
CREATE INDEX idx_document_participant_id ON documents(participant_id);
CREATE INDEX idx_gis_project_id ON project_gis(project_id);

-- Search indexes
CREATE INDEX idx_participant_full_name ON participants(full_name);
CREATE INDEX idx_participant_email ON participants(email);

-- Composite indexes (for complex WHERE clauses)
CREATE INDEX idx_participant_project_status ON participants(project_id, status);
```

### Monitor Index Usage

```sql
-- PostgreSQL: Find unused indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND indexname NOT IN (
    SELECT indexname FROM pg_stat_user_indexes
    WHERE idx_scan = 0
  );
```

## Performance Benchmarks

### Before Optimization

```
GET /api/projects/123/participants?limit=50

Queries: 2
- SELECT * FROM participants WHERE project_id = '123' LIMIT 50
- SELECT participant_id FROM documents WHERE participant_id IN (...)

Time: ~150ms
```

### After Optimization

```
GET /api/projects/123/participants?limit=50

Queries: 1
- SELECT p.*, COUNT(d.id) as documentCount
  FROM participants p
  LEFT JOIN documents d ON p.id = d.participant_id
  WHERE p.project_id = '123'
  GROUP BY p.id

Time: ~50ms
```

**Improvement: 3x faster, 50% fewer queries**

## Best Practices

### 1. Always Use `where` to Filter Early

```typescript
// ❌ BAD: Fetch all, then filter in code
const all = await Project.findAll();
const active = all.filter(p => p.status === 'active');

// ✅ GOOD: Filter in query
const active = await Project.findAll({ where: { status: 'active' } });
```

### 2. Use `raw: true` for Read-Only Data

When you don't need Sequelize models:

```typescript
// ✅ GOOD: Faster for read-only queries
const data = await Participant.findAll({
  raw: true,  // Skips model instantiation
  attributes: ['id', 'fullName'],
});
```

### 3. Paginate Large Result Sets

```typescript
// ✅ GOOD: Paginate to avoid memory bloat
const page = await Participant.findAll({
  limit: 50,
  offset: (pageNum - 1) * 50,
});
```

### 4. Avoid `select *` in Includes

```typescript
// ❌ BAD: Unnecessary data
include: [{ model: Document }]

// ✅ GOOD: Only fetch needed fields
include: [{
  model: Document,
  attributes: []  // Just for counting/joining
}]
```

### 5. Use Transactions for Multi-Step Operations

```typescript
// ✅ GOOD: All-or-nothing semantics
const transaction = await sequelize.transaction();
try {
  await Project.create(data, { transaction });
  await Developer.update({ projectCount: count }, { transaction });
  await transaction.commit();
} catch {
  await transaction.rollback();
}
```

## Debugging N+1 Problems

### 1. Enable SQL Logging

```bash
SQL_LOG=true npm run dev
```

Look for repeated queries with different parameters.

### 2. Use Sequelize Debugging

```typescript
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(DATABASE_URL, {
  logging: (sql) => {
    if (sql.includes('SELECT')) {
      console.log(`[SQL] ${sql}`);
    }
  },
});
```

### 3. Measure API Response Time

Use `console.time()`:

```typescript
console.time('listParticipants');
const participants = await Participant.findAll();
console.timeEnd('listParticipants');
```

### 4. Review Production Logs

Look for slow queries:

```bash
grep "Duration: [5-9][0-9][0-9]ms\|Duration: [0-9]{4,}ms" server.log
```

## References

- [Sequelize Eager Loading](https://sequelize.org/docs/v6/advanced-association-concepts/eager-loading/)
- [SQL Aggregate Functions](https://www.postgresql.org/docs/current/functions-aggregate.html)
- [Database Indexing Best Practices](https://use-the-index-luke.com/)
- [N+1 Query Problem](https://stackoverflow.com/questions/97197/what-is-the-n1-selects-problem-in-orm-hibernate)
