# Testing Guide

## Overview

The Carbon Project Management Platform uses Jest for API integration testing. Tests cover:
- Authentication (signup, signin)
- Project CRUD operations
- Participant CRUD operations
- Error handling and validation
- Access control and authorization

## Running Tests

### Run All Tests

```bash
npm run test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Specific Test File

```bash
npm run test -- api.test.ts
```

### Run with Coverage Report

```bash
npm run test:coverage
```

### Run Single Test Suite

```bash
npm run test -- --testNamePattern="Authentication"
```

## Test Structure

### Setup & Teardown

Each test file includes setup/teardown hooks:

```typescript
beforeAll(async () => {
  // Run once before all tests
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Run once after all tests
  await sequelize.drop();
  await sequelize.close();
});

beforeEach(async () => {
  // Run before each test (if needed)
});

afterEach(async () => {
  // Run after each test (if needed)
});
```

## Writing Tests

### Basic Test Structure

```typescript
describe('Feature Name', () => {
  it('should do something', async () => {
    // Arrange
    const input = { name: 'Test' };

    // Act
    const response = await request(app)
      .post('/api/endpoint')
      .send(input);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe('Test');
  });
});
```

### Testing API Endpoints

```typescript
// GET request
const res = await request(app)
  .get('/api/projects')
  .set('Authorization', `Bearer ${token}`)
  .expect(200);

// POST request
const res = await request(app)
  .post('/api/projects')
  .set('Authorization', `Bearer ${token}`)
  .send({ name: 'New Project' })
  .expect(201);

// PATCH request
const res = await request(app)
  .patch(`/api/projects/${id}`)
  .set('Authorization', `Bearer ${token}`)
  .send({ status: 'active' })
  .expect(200);

// DELETE request
const res = await request(app)
  .delete(`/api/projects/${id}`)
  .set('Authorization', `Bearer ${token}`)
  .expect(200);
```

### Testing with Authentication

```typescript
// 1. Register developer
const signupRes = await request(app)
  .post('/api/auth/signup')
  .send({
    email: 'test@example.com',
    password: 'SecurePassword123!',
    fullName: 'Test User',
  });

const developerId = signupRes.body.data.id;

// 2. Sign in and get token
const signinRes = await request(app)
  .post('/api/auth/signin')
  .send({
    email: 'test@example.com',
    password: 'SecurePassword123!',
  });

const authToken = signinRes.body.token;

// 3. Make authenticated request
const res = await request(app)
  .get('/api/projects')
  .set('Authorization', `Bearer ${authToken}`)
  .expect(200);
```

### Testing Error Cases

```typescript
// Validation error
it('should reject invalid input', async () => {
  const res = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: '' }) // Invalid: empty name
    .expect(400);

  expect(res.body.code).toBe('VALIDATION_ERROR');
  expect(res.body.details).toBeDefined();
});

// Authorization error
it('should deny access to other developer projects', async () => {
  const res = await request(app)
    .get(`/api/projects/${otherDeveloperProjectId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(404);

  expect(res.body.code).toBe('NOT_FOUND');
});

// Not found error
it('should return 404 for non-existent resource', async () => {
  const res = await request(app)
    .get('/api/projects/nonexistent-id')
    .set('Authorization', `Bearer ${token}`)
    .expect(404);

  expect(res.body.code).toBe('NOT_FOUND');
});
```

## Test Coverage

### Current Coverage

Run coverage report:

```bash
npm run test:coverage
```

Output:

```
----------|----------|----------|----------|----------|
File      | % Stmts  | % Branch | % Funcs  | % Lines  |
----------|----------|----------|----------|----------|
All files | 75       | 70       | 80       | 75       |
----------|----------|----------|----------|----------|
```

### Coverage Goals

| Metric | Target |
|--------|--------|
| Statements | >75% |
| Branches | >70% |
| Functions | >80% |
| Lines | >75% |

### Adding to Untested Code

Identify untested files:

```bash
npm run test:coverage -- --coverageReporters=text-lcov | grep -i "untested"
```

Then add tests to `__tests__/` directory.

## Best Practices

### 1. Use Descriptive Test Names

```typescript
// ❌ Bad
it('works', async () => { });

// ✅ Good
it('should create project with valid data', async () => { });
```

### 2. Follow Arrange-Act-Assert Pattern

```typescript
it('should update project', async () => {
  // Arrange
  const updateData = { name: 'New Name' };

  // Act
  const res = await request(app)
    .patch(`/api/projects/${id}`)
    .set('Authorization', `Bearer ${token}`)
    .send(updateData)
    .expect(200);

  // Assert
  expect(res.body.data.name).toBe('New Name');
});
```

### 3. Test Both Success and Failure Cases

```typescript
describe('Project Creation', () => {
  it('should create with valid data', async () => { /* ... */ });
  it('should reject missing name', async () => { /* ... */ });
  it('should reject invalid project type', async () => { /* ... */ });
  it('should require authentication', async () => { /* ... */ });
});
```

### 4. Clean Up Test Data

```typescript
afterEach(async () => {
  // Reset database state
  await Project.truncate();
  await Participant.truncate();
});
```

### 5. Test Boundary Conditions

```typescript
describe('Pagination', () => {
  it('should handle first page', async () => { });
  it('should handle middle pages', async () => { });
  it('should handle last page', async () => { });
  it('should handle empty result', async () => { });
});
```

## Common Assertions

```typescript
// Status codes
expect(response.status).toBe(200);
expect(response.statusCode).toBe(201);

// Response body
expect(response.body.data).toBeDefined();
expect(response.body.data.id).toEqual(id);
expect(response.body.message).toBe('Project created.');

// Arrays
expect(response.body.data).toHaveLength(5);
expect(response.body.data).toContainEqual({ id: '123' });

// Objects
expect(response.body.data).toHaveProperty('name');
expect(response.body.pagination).toMatchObject({
  total: 10,
  page: 1,
});

// Truthiness
expect(response.body.success).toBeTruthy();
expect(response.body.data).toBeFalsy();

// Errors
expect(() => { /* code */ }).toThrow();
expect(response.body.error).toMatch(/validation failed/i);
```

## Debugging Tests

### Run Single Test

```bash
npm run test -- --testNamePattern="should create project"
```

### Run Tests Matching Pattern

```bash
npm run test -- api.test.ts --testNamePattern="Authentication"
```

### Verbose Output

```bash
npm run test -- --verbose
```

### Stop on First Failure

```bash
npm run test -- --bail
```

### Debug with Node Inspector

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome.

## Performance Considerations

### Database Test Isolation

Each test suite gets a fresh database:

```typescript
beforeAll(async () => {
  await sequelize.sync({ force: true }); // Drop and recreate
});
```

This ensures tests don't interfere with each other but makes tests slower.

### Optimize for Speed

```typescript
// Run tests in parallel (default)
npm run test

// Run tests sequentially (for debugging)
npm run test -- --runInBand

// Run only changed tests
npm run test -- --onlyChanged

// Run tests matching pattern (faster)
npm run test -- --testNamePattern="Authentication"
```

### Test Timeout

Default timeout is 10 seconds (set in jest.config.js):

```javascript
testTimeout: 10000, // ms
```

Increase for slow tests:

```typescript
it('slow test', async () => {
  // ...
}, 30000); // 30 second timeout for this test
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test -- --coverage
      - uses: codecov/codecov-action@v2
```

## Common Issues

### Tests Timing Out

**Problem:** Tests exceed 10-second timeout.

**Solution:**
```typescript
it('slow test', async () => {
  // ...
}, 30000); // Increase timeout
```

### Port Already in Use

**Problem:** Multiple test processes using same port.

**Solution:**
```bash
npm run test -- --runInBand
```

### Database Lock

**Problem:** Database connection timeout.

**Solution:**
```typescript
afterAll(async () => {
  await sequelize.close(); // Ensure connection closes
});
```

### Flaky Tests

**Problem:** Tests pass sometimes, fail sometimes.

**Solution:**
- Avoid hard timeouts (use retry logic)
- Don't rely on timing
- Mock external services
- Use deterministic data

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
- [API Testing Guide](https://www.postman.com/api-testing/)

## Next Steps

- Phase 5.2: React component tests
- Phase 6.1: Containerization (Docker)
- Phase 6.2: Production configuration
