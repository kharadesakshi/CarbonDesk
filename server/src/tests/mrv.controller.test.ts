import request from 'supertest';
import { Express } from 'express';
import { randomUUID as uuidv4 } from 'crypto';
import app from '../app';
import { sequelize } from '../models';
import { CarbonDeveloper, Project, MRVCycle, Measurement, MeasurementType } from '../models';

// ─── Test Setup ───────────────────────────────────────────────────────────────

let testDeveloper: any;
let testProject: any;
let authToken: string;

const testAuth = async () => {
  const response = await request(app).post('/api/auth/register').send({
    fullName: 'Test User',
    email: `test-${uuidv4()}@example.com`,
    password: 'Test@123',
    organizationName: 'Test Org',
  });

  authToken = response.body.data?.token;
  testDeveloper = response.body.data?.developer;
  return authToken;
};

const createTestProject = async (token: string) => {
  const response = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Test MRV Project',
      projectCode: `PRJ-${uuidv4().slice(0, 8)}`,
      projectType: 'ARR',
      country: 'India',
      stateRegion: 'Punjab',
      description: 'Test project for MRV',
    });

  return response.body.data;
};

const createTestMeasurementType = async () => {
  const type = await MeasurementType.create({
    name: 'Carbon Dioxide Equivalent',
    category: 'GHG_EMISSIONS',
    unit: 'tonnes',
    description: 'Test measurement type',
  });
  return type;
};

beforeAll(async () => {
  await sequelize.sync({ force: false });
  await testAuth();
});

afterAll(async () => {
  await sequelize.close();
});

// ─── MRV Cycle Tests ──────────────────────────────────────────────────────────

describe('MRV Controller - MRV Cycles', () => {
  let projectId: string;
  let mrvCycleId: string;

  beforeAll(async () => {
    testProject = await createTestProject(authToken);
    projectId = testProject.id;
  });

  test('POST /projects/:projectId/mrv - Create MRV Cycle', async () => {
    const response = await request(app)
      .post(`/api/projects/${projectId}/mrv`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        cycleName: 'Q1 2024 Monitoring',
        cycleCode: 'MRV-Q1-2024',
        monitoringStartDate: '2024-01-01',
        monitoringEndDate: '2024-03-31',
        description: 'First quarter monitoring cycle',
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.cycleName).toBe('Q1 2024 Monitoring');
    expect(response.body.data.status).toBe('draft');
    mrvCycleId = response.body.data.id;
  });

  test('POST /projects/:projectId/mrv - Reject if end date before start date', async () => {
    const response = await request(app)
      .post(`/api/projects/${projectId}/mrv`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        cycleName: 'Invalid Cycle',
        cycleCode: 'MRV-INVALID',
        monitoringStartDate: '2024-03-31',
        monitoringEndDate: '2024-01-01',
      });

    expect(response.status).toBe(400);
  });

  test('GET /projects/:projectId/mrv - List MRV Cycles', async () => {
    const response = await request(app)
      .get(`/api/projects/${projectId}/mrv`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/mrv/:mrvCycleId - Get MRV Cycle Details', async () => {
    const response = await request(app)
      .get(`/api/mrv/${mrvCycleId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(mrvCycleId);
    expect(response.body.data.cycleName).toBe('Q1 2024 Monitoring');
  });

  test('PUT /api/mrv/:mrvCycleId - Update MRV Cycle', async () => {
    const response = await request(app)
      .put(`/api/mrv/${mrvCycleId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        cycleName: 'Q1 2024 Monitoring - Updated',
        description: 'Updated description',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.cycleName).toBe('Q1 2024 Monitoring - Updated');
  });

  test('DELETE /api/mrv/:mrvCycleId - Delete MRV Cycle', async () => {
    const createResponse = await request(app)
      .post(`/api/projects/${projectId}/mrv`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        cycleName: 'Cycle to Delete',
        cycleCode: 'MRV-DELETE',
        monitoringStartDate: '2024-01-01',
        monitoringEndDate: '2024-03-31',
      });

    const cycleIdToDelete = createResponse.body.data.id;

    const deleteResponse = await request(app)
      .delete(`/api/mrv/${cycleIdToDelete}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteResponse.status).toBe(200);

    const getResponse = await request(app)
      .get(`/api/mrv/${cycleIdToDelete}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getResponse.status).toBe(404);
  });

  // Test for remaining tests using this mrvCycleId
  test('Store mrvCycleId for measurement tests', () => {
    expect(mrvCycleId).toBeDefined();
  });
});

// ─── Measurement Tests ────────────────────────────────────────────────────────

describe('MRV Controller - Measurements', () => {
  let projectId: string;
  let mrvCycleId: string;
  let measurementTypeId: string;
  let measurementId: string;

  beforeAll(async () => {
    testProject = await createTestProject(authToken);
    projectId = testProject.id;

    const cycleResponse = await request(app)
      .post(`/api/projects/${projectId}/mrv`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        cycleName: 'Measurement Test Cycle',
        cycleCode: `MRV-MT-${uuidv4().slice(0, 6)}`,
        monitoringStartDate: '2024-01-01',
        monitoringEndDate: '2024-03-31',
      });

    mrvCycleId = cycleResponse.body.data.id;

    const type = await createTestMeasurementType();
    measurementTypeId = type.id;
  });

  test('POST /projects/:projectId/mrv/:mrvCycleId/measurements - Create Measurement', async () => {
    const response = await request(app)
      .post(`/api/projects/${projectId}/mrv/${mrvCycleId}/measurements`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        measurementTypeId,
        value: '125.5',
        unit: 'tonnes',
        measurementDate: '2024-02-15',
        source: 'manual',
        dataCategory: 'baseline',
        notes: 'Initial baseline measurement',
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.value).toBe(125.5);
    expect(response.body.data.status).toBe('draft');
    measurementId = response.body.data.id;
  });

  test('POST /projects/:projectId/mrv/:mrvCycleId/measurements - Reject invalid value', async () => {
    const response = await request(app)
      .post(`/api/projects/${projectId}/mrv/${mrvCycleId}/measurements`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        measurementTypeId,
        value: 'not-a-number',
        unit: 'tonnes',
        measurementDate: '2024-02-15',
      });

    expect(response.status).toBe(400);
  });

  test('GET /mrv/:mrvCycleId/measurements - List Measurements', async () => {
    const response = await request(app)
      .get(`/api/mrv/${mrvCycleId}/measurements`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/measurements/:measurementId - Get Measurement Details', async () => {
    const response = await request(app)
      .get(`/api/measurements/${measurementId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(measurementId);
    expect(response.body.data.value).toBe(125.5);
  });

  test('PUT /api/measurements/:measurementId - Update Measurement', async () => {
    const response = await request(app)
      .put(`/api/measurements/${measurementId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        value: '150.0',
        notes: 'Corrected baseline measurement',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.value).toBe(150.0);
  });

  test('POST /api/measurements/:measurementId/submit - Submit Measurement', async () => {
    const response = await request(app)
      .post(`/api/measurements/${measurementId}/submit`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        notes: 'Submitting for validation',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('submitted');
  });

  test('POST /api/measurements/:measurementId/validate - Validate Measurement', async () => {
    const response = await request(app)
      .post(`/api/measurements/${measurementId}/validate`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'valid',
        validationNotes: 'Data looks correct',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('valid');
  });

  test('POST /api/measurements/:measurementId/validate - Reject as invalid', async () => {
    const createResponse = await request(app)
      .post(`/api/projects/${projectId}/mrv/${mrvCycleId}/measurements`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        measurementTypeId,
        value: '9999.0',
        unit: 'tonnes',
        measurementDate: '2024-02-15',
        source: 'manual',
      });

    const newMeasurementId = createResponse.body.data.id;

    await request(app)
      .post(`/api/measurements/${newMeasurementId}/submit`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    const response = await request(app)
      .post(`/api/measurements/${newMeasurementId}/validate`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'invalid',
        validationNotes: 'Value out of acceptable range',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('invalid');
  });

  test('DELETE /api/measurements/:measurementId - Delete Measurement', async () => {
    const createResponse = await request(app)
      .post(`/api/projects/${projectId}/mrv/${mrvCycleId}/measurements`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        measurementTypeId,
        value: '50.0',
        unit: 'tonnes',
        measurementDate: '2024-02-15',
      });

    const measToDelete = createResponse.body.data.id;

    const deleteResponse = await request(app)
      .delete(`/api/measurements/${measToDelete}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteResponse.status).toBe(200);

    const getResponse = await request(app)
      .get(`/api/measurements/${measToDelete}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getResponse.status).toBe(404);
  });
});

// ─── Measurement Type Tests ───────────────────────────────────────────────────

describe('MRV Controller - Measurement Types', () => {
  let typeId: string;

  test('GET /api/measurement-types - List Measurement Types', async () => {
    const response = await request(app)
      .get('/api/measurement-types')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('POST /api/measurement-types - Create Measurement Type (Admin)', async () => {
    // This test assumes admin role or will be rejected
    // For now, we test that the endpoint exists
    const response = await request(app)
      .post('/api/measurement-types')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        measurementCode: `MT-${uuidv4().slice(0, 6)}`,
        measurementName: 'Methane Emissions',
        category: 'GHG_EMISSIONS',
        unit: 'kg',
        applicableFor: ['all'],
      });

    // Could be 201 (created) or 403 (forbidden depending on role)
    expect([201, 403]).toContain(response.status);
  });

  test('GET /api/measurement-types?category=GHG_EMISSIONS - Filter by Category', async () => {
    const response = await request(app)
      .get('/api/measurement-types?category=GHG_EMISSIONS')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

// ─── Report Tests ─────────────────────────────────────────────────────────────

describe('MRV Controller - Reports', () => {
  let projectId: string;
  let mrvCycleId: string;
  let measurementTypeId: string;
  let reportId: string;

  beforeAll(async () => {
    testProject = await createTestProject(authToken);
    projectId = testProject.id;

    const cycleResponse = await request(app)
      .post(`/api/projects/${projectId}/mrv`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        cycleName: 'Report Test Cycle',
        cycleCode: `MRV-RT-${uuidv4().slice(0, 6)}`,
        monitoringStartDate: '2024-01-01',
        monitoringEndDate: '2024-03-31',
      });

    mrvCycleId = cycleResponse.body.data.id;

    const type = await createTestMeasurementType();
    measurementTypeId = type.id;

    // Create and validate some measurements
    for (let i = 0; i < 3; i++) {
      const measResponse = await request(app)
        .post(`/api/projects/${projectId}/mrv/${mrvCycleId}/measurements`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          measurementTypeId,
          value: `${100 + i * 10}`,
          unit: 'tonnes',
          measurementDate: '2024-02-15',
          source: 'manual',
        });

      const measId = measResponse.body.data.id;

      await request(app)
        .post(`/api/measurements/${measId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send();

      await request(app)
        .post(`/api/measurements/${measId}/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'valid',
        });
    }
  });

  test('POST /api/mrv/:mrvCycleId/report/generate - Generate Report', async () => {
    const response = await request(app)
      .post(`/api/mrv/${mrvCycleId}/report/generate`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('reportCode');
    expect(response.body.data.status).toBe('draft');
    reportId = response.body.data.id;
  });

  test('GET /api/reports/:reportId - Get Report Details', async () => {
    const response = await request(app)
      .get(`/api/reports/${reportId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(reportId);
  });

  test('POST /api/reports/:reportId/submit - Submit Report', async () => {
    const response = await request(app)
      .post(`/api/reports/${reportId}/submit`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('submitted');
  });
});

// ─── Verification Tests ───────────────────────────────────────────────────────

describe('MRV Controller - Verification', () => {
  let projectId: string;
  let mrvCycleId: string;
  let measurementTypeId: string;
  let reportId: string;

  beforeAll(async () => {
    testProject = await createTestProject(authToken);
    projectId = testProject.id;

    const cycleResponse = await request(app)
      .post(`/api/projects/${projectId}/mrv`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        cycleName: 'Verification Test Cycle',
        cycleCode: `MRV-VT-${uuidv4().slice(0, 6)}`,
        monitoringStartDate: '2024-01-01',
        monitoringEndDate: '2024-03-31',
      });

    mrvCycleId = cycleResponse.body.data.id;

    const type = await createTestMeasurementType();
    measurementTypeId = type.id;

    // Create and validate measurements for report
    for (let i = 0; i < 2; i++) {
      const measResponse = await request(app)
        .post(`/api/projects/${projectId}/mrv/${mrvCycleId}/measurements`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          measurementTypeId,
          value: `${200 + i * 50}`,
          unit: 'tonnes',
          measurementDate: '2024-02-20',
          source: 'document',
        });

      const measId = measResponse.body.data.id;

      await request(app)
        .post(`/api/measurements/${measId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send();

      await request(app)
        .post(`/api/measurements/${measId}/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'valid',
        });
    }

    // Generate report
    const reportResponse = await request(app)
      .post(`/api/mrv/${mrvCycleId}/report/generate`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    reportId = reportResponse.body.data.id;

    // Submit report
    await request(app)
      .post(`/api/reports/${reportId}/submit`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();
  });

  test('POST /api/reports/:reportId/verify - Record Verification', async () => {
    const response = await request(app)
      .post(`/api/reports/${reportId}/verify`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'verified',
        comments: 'All data verified successfully',
        findings: 'No discrepancies found',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.verificationStatus).toBe('verified');
  });

  test('POST /api/reports/:reportId/verify - Reject Report', async () => {
    // Create new report for rejection test
    const cycleResponse = await request(app)
      .post(`/api/projects/${projectId}/mrv`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        cycleName: 'Rejection Test Cycle',
        cycleCode: `MRV-RTJ-${uuidv4().slice(0, 6)}`,
        monitoringStartDate: '2024-04-01',
        monitoringEndDate: '2024-06-30',
      });

    const testCycleId = cycleResponse.body.data.id;

    const type = await createTestMeasurementType();

    const measResponse = await request(app)
      .post(`/api/projects/${projectId}/mrv/${testCycleId}/measurements`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        measurementTypeId: type.id,
        value: '300',
        unit: 'tonnes',
        measurementDate: '2024-05-15',
        source: 'manual',
      });

    const measId = measResponse.body.data.id;

    await request(app)
      .post(`/api/measurements/${measId}/submit`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    await request(app)
      .post(`/api/measurements/${measId}/validate`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'valid',
      });

    const reportResponse = await request(app)
      .post(`/api/mrv/${testCycleId}/report/generate`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    const testReportId = reportResponse.body.data.id;

    await request(app)
      .post(`/api/reports/${testReportId}/submit`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    const rejectResponse = await request(app)
      .post(`/api/reports/${testReportId}/verify`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'rejected',
        comments: 'Data quality issues',
        findings: 'Measurements do not align with baseline',
      });

    expect(rejectResponse.status).toBe(200);
    expect(rejectResponse.body.data.verificationStatus).toBe('rejected');
  });
});

// ─── Authorization Tests ──────────────────────────────────────────────────────

describe('MRV Controller - Authorization', () => {
  test('GET /api/projects/:projectId/mrv - Reject without auth', async () => {
    const response = await request(app).get(`/api/projects/fake-id/mrv`);

    expect(response.status).toBe(401);
  });

  test('POST /api/projects/:projectId/mrv - Reject without auth', async () => {
    const response = await request(app)
      .post(`/api/projects/fake-id/mrv`)
      .send({
        cycleName: 'Test',
        cycleCode: 'TEST',
        monitoringStartDate: '2024-01-01',
        monitoringEndDate: '2024-03-31',
      });

    expect(response.status).toBe(401);
  });
});
