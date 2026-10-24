# Error Handling Guide

## Overview

The Carbon Project Management Platform implements comprehensive error handling that distinguishes between:

1. **Operational Errors** — Expected failures (validation, missing resources, auth failures)
2. **Programming Errors** — Unexpected failures (null pointers, logic bugs, type errors)

## Error Types

### AppError (Operational)

Use for expected failures that are safe to communicate to the client.

```typescript
import { AppError } from '../middleware/errorHandler';

// 400 Bad Request
throw new AppError('Invalid project name', 400);

// 401 Unauthorized
throw new AppError('Invalid credentials', 401);

// 403 Forbidden
throw new AppError('You do not have permission to access this project', 403);

// 404 Not Found
throw new AppError('Project not found', 404);

// 409 Conflict
throw new AppError('Project with this name already exists', 409);

// 500 Server Error (if absolutely necessary — usually avoid)
throw new AppError('Database connection failed', 500);
```

### ProgrammingError (Development Only)

Use to explicitly mark programming errors for debugging:

```typescript
import { ProgrammingError } from '../middleware/errorHandler';

// This will NOT be sent to client (generic message instead)
throw new ProgrammingError('Null pointer: user object is undefined');
```

### Native Error Handling

The middleware automatically categorizes native errors:

```typescript
// Validation errors (Zod)
// → 400 Bad Request with field details

// Database validation errors (Sequelize)
// → 400 Bad Request with field details

// Duplicate key errors (Unique constraint)
// → 409 Conflict

// File not found errors
// → 404 Not Found

// Permission errors
// → 403 Forbidden

// JSON parse errors
// → 400 Bad Request

// Unknown errors
// → 500 Internal Server Error (with stack trace in development)
```

## HTTP Status Codes

| Code | Use Case | Example |
|------|----------|---------|
| 400 | Request validation failed | Invalid email format, missing required field |
| 401 | Authentication failed | Invalid token, expired session |
| 403 | Forbidden | Insufficient permissions, access denied |
| 404 | Resource not found | Project doesn't exist, document deleted |
| 409 | Conflict | Duplicate email, unique constraint violation |
| 500 | Server error | Database crash, unhandled exception |

## Error Response Format

All error responses follow this structure:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "requestId": "err-timestamp-random",
  "timestamp": "2024-08-21T10:00:00Z",
  "details": [],
  "stack": "..." // Only in development
}
```

### Examples

#### Validation Error
```json
{
  "error": "Request validation failed.",
  "code": "VALIDATION_ERROR",
  "requestId": "err-1724241600000-abc123",
  "timestamp": "2024-08-21T10:00:00Z",
  "details": [
    {
      "path": "email",
      "message": "Invalid email format",
      "code": "invalid_string"
    }
  ]
}
```

#### Database Error
```json
{
  "error": "A record with this value already exists.",
  "code": "DUPLICATE_ERROR",
  "requestId": "err-1724241600000-abc123",
  "timestamp": "2024-08-21T10:00:00Z",
  "details": [
    "Email already in use"
  ]
}
```

#### Authorization Error
```json
{
  "error": "You do not have permission to access this project",
  "code": "APP_ERROR",
  "requestId": "err-1724241600000-abc123",
  "timestamp": "2024-08-21T10:00:00Z"
}
```

#### Server Error (Production)
```json
{
  "error": "An unexpected error occurred. Please try again.",
  "code": "INTERNAL_ERROR",
  "requestId": "err-1724241600000-abc123",
  "timestamp": "2024-08-21T10:00:00Z"
}
```

#### Server Error (Development)
```json
{
  "error": "Cannot read property 'id' of undefined",
  "code": "INTERNAL_ERROR",
  "requestId": "err-1724241600000-abc123",
  "timestamp": "2024-08-21T10:00:00Z",
  "stack": "TypeError: Cannot read property 'id' of undefined\n    at Developer.findById (...)"
}
```

## Best Practices

### 1. Throw AppError for Expected Failures

```typescript
// ❌ Bad — throws generic error
if (!project) {
  throw new Error('Project not found');
}

// ✅ Good — explicit operational error
if (!project) {
  throw new AppError('Project not found', 404);
}
```

### 2. Validate Early, Fail Fast

```typescript
// ❌ Bad — validation happens deep in logic
export async function createProject(req: Request, res: Response) {
  const data = req.body;
  // ... 20 lines of logic ...
  if (!data.name) throw new AppError('Project name required', 400);
}

// ✅ Good — validation at route entry
export async function createProject(req: Request, res: Response) {
  const data = createProjectSchema.parse(req.body); // Throws early
  // Now we know data is valid
  await project.create(data);
}
```

### 3. Provide Helpful Error Messages

```typescript
// ❌ Bad — vague
throw new AppError('Invalid', 400);

// ✅ Good — specific
throw new AppError('Email already in use. Please sign up with a different email or reset your password.', 400);
```

### 4. Don't Expose Internal Details in Production

```typescript
// ❌ Bad — exposes SQL query
throw new AppError(`Database error: ${dbError.message}`, 500);

// ✅ Good — generic message in production, detailed in logs
console.error('Database error:', dbError);
throw new AppError('An unexpected error occurred. Please try again.', 500);
```

### 5. Use Request ID for Debugging

When investigating errors in production, use the `requestId` to correlate with server logs:

```bash
# Find request in logs
grep "err-1724241600000-abc123" server.log
```

### 6. Handle Async Errors

Express doesn't catch errors in async handlers by default. Use `express-async-errors`:

```typescript
// ❌ Bad — error not caught by middleware
export async function getProject(req: Request, res: Response) {
  const project = await Project.findByPk(req.params.id); // May throw
  throw new Error('Something'); // Not caught
}

// ✅ Good — express-async-errors catches it
// Just import it in server.ts: import 'express-async-errors'
export async function getProject(req: Request, res: Response) {
  const project = await Project.findByPk(req.params.id); // Caught automatically
  if (!project) throw new AppError('Project not found', 404);
}
```

## Common Errors

### Validation Errors (Zod)

```typescript
import { createProjectSchema } from '../validators/project.validator';

try {
  const data = createProjectSchema.parse(req.body);
} catch (err) {
  // Zod errors are automatically handled by middleware
  // Returns 400 with field-level details
}
```

### Database Errors

```typescript
try {
  const project = await Project.create(data);
} catch (err) {
  // Sequelize validation errors → 400
  // Unique constraint errors → 409
  // Other DB errors → 500
  // Automatically handled by middleware
}
```

### File Errors

```typescript
try {
  const content = fs.readFileSync(path);
} catch (err) {
  // ENOENT → 404 Not Found
  // EACCES → 403 Permission Denied
  // Automatically handled by middleware
}
```

### JSON Parse Errors

```typescript
// This happens automatically in Express
app.use(express.json());
// If body isn't valid JSON:
// → 400 Bad Request with code INVALID_JSON
// Automatically handled by middleware
```

## Debugging in Development

When `NODE_ENV=development`, error responses include the full stack trace:

```json
{
  "error": "Cannot read property 'id' of undefined",
  "stack": "TypeError: Cannot read property 'id' of undefined\n    at line 42 in projectService.ts",
  "requestId": "err-...",
  "timestamp": "2024-08-21T10:00:00Z"
}
```

This helps quickly identify the root cause during development.

## Production Monitoring

In production, monitor:

1. **Error Rate** — Spike in 5XX errors indicates issues
2. **Request ID** — Use to correlate errors across logs
3. **Error Codes** — Group by code to identify patterns
4. **Response Times** — Slow responses may indicate database issues

Example monitoring query:

```bash
# Find all errors in last hour
grep "\[ERROR\]" server.log | grep "2024-08-21T[09-10]"

# Find all permission errors
grep "PERMISSION_DENIED" server.log

# Find all database errors
grep "DB_" server.log
```

## Testing Errors

When writing tests, verify error handling:

```typescript
it('should return 404 when project not found', async () => {
  const res = await request(app)
    .get('/api/projects/nonexistent-id')
    .expect(404);

  expect(res.body.code).toBe('NOT_FOUND');
  expect(res.body.error).toContain('not found');
});

it('should return 400 for invalid project name', async () => {
  const res = await request(app)
    .post('/api/projects')
    .send({ name: '' }) // Invalid
    .expect(400);

  expect(res.body.code).toBe('VALIDATION_ERROR');
  expect(res.body.details).toBeDefined();
});
```

## Summary

| Scenario | Action | Status |
|----------|--------|--------|
| **Invalid input** | Throw `AppError` with message | 400 |
| **Not found** | Throw `AppError` with message | 404 |
| **Unauthorized** | Throw `AppError` with message | 401 |
| **Forbidden** | Throw `AppError` with message | 403 |
| **Conflict (duplicate)** | Let Sequelize error through | 409 |
| **Unexpected error** | Log & throw generic `AppError` | 500 |
| **Programming bug** | Throw generic error, middleware logs | 500 + dev stack |

The middleware handles categorization, logging, and response formatting automatically.
