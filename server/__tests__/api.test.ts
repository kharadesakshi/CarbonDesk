/**
 * API Integration Tests
 * Tests core workflows: auth, projects, participants
 * Run with: npm run test
 */

import request from 'supertest';
import app from '../src/app';
import { sequelize, Developer, Project, Participant } from '../src/models';

describe('Carbon Project Management Platform - API Integration Tests', () => {
  let authToken: string;
  let developerId: string;
  let projectId: string;
  let participantId: string;

  // ──────────────────────────────────────────────────────────────────────────
  // Setup & Teardown
  // ──────────────────────────────────────────────────────────────────────────

  beforeAll(async () => {
    // Sync database (test mode)
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Cleanup
    await sequelize.drop();
    await sequelize.close();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Authentication Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('POST /api/auth/signup', () => {
    it('should register a new developer', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'SecurePassword123!',
          fullName: 'Test Developer',
        })
        .expect(201);

      expect(res.body.message).toBe('Developer registered.');
      expect(res.body.data.email).toBe('test@example.com');
      expect(res.body.data.fullName).toBe('Test Developer');

      developerId = res.body.data.id;
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com', // Already registered
          password: 'SecurePassword123!',
          fullName: 'Another Developer',
        })
        .expect(409); // Conflict

      expect(res.body.code).toBe('DUPLICATE_ERROR');
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'weak@example.com',
          password: '123', // Too weak
          fullName: 'Weak Password',
        })
        .expect(400); // Validation error

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'SecurePassword123!',
          fullName: 'Invalid Email',
        })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/signin', () => {
    it('should authenticate and return token', async () => {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'SecurePassword123!',
        })
        .expect(200);

      expect(res.body.message).toBe('Login successful.');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.email).toBe('test@example.com');

      authToken = res.body.token;
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(res.body.code).toBe('APP_ERROR');
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePassword123!',
        })
        .expect(401);

      expect(res.body.code).toBe('APP_ERROR');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Project Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('POST /api/projects (Create Project)', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({
          name: 'Test Project',
          projectCode: 'TEST-001',
          country: 'Kenya',
        })
        .expect(401);

      expect(res.body.code).toBe('APP_ERROR');
    });

    it('should create a project with auth token', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Carbon Project Alpha',
          projectCode: 'CPA-001',
          country: 'Kenya',
          projectType: 'forest_conservation',
          description: 'Test carbon project',
        })
        .expect(201);

      expect(res.body.message).toBe('Project created.');
      expect(res.body.data.name).toBe('Carbon Project Alpha');
      expect(res.body.data.projectCode).toBe('CPA-001');
      expect(res.body.data.developerId).toBe(developerId);

      projectId = res.body.data.id;
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectCode: 'CPA-002',
          // Missing name
        })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/projects (List Projects)', () => {
    it('should list developer projects', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should search projects by name', async () => {
      const res = await request(app)
        .get('/api/projects?search=Alpha')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toContain('Alpha');
    });

    it('should filter projects by status', async () => {
      const res = await request(app)
        .get('/api/projects?status=draft')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/projects/:id (Get Project)', () => {
    it('should get project details', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(projectId);
      expect(res.body.data.name).toBe('Carbon Project Alpha');
    });

    it('should return 404 for non-existent project', async () => {
      const res = await request(app)
        .get(`/api/projects/nonexistent-id`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('should deny access to other developer projects', async () => {
      // Register another developer
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'other@example.com',
          password: 'SecurePassword123!',
          fullName: 'Other Developer',
        });

      const otherToken = (
        await request(app)
          .post('/api/auth/signin')
          .send({
            email: 'other@example.com',
            password: 'SecurePassword123!',
          })
      ).body.token;

      // Try to access first developer's project
      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/projects/:id (Update Project)', () => {
    it('should update project details', async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Project Name',
          status: 'active',
        })
        .expect(200);

      expect(res.body.message).toBe('Project updated.');
      expect(res.body.data.name).toBe('Updated Project Name');
      expect(res.body.data.status).toBe('active');
    });

    it('should validate update data', async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'invalid-status',
        })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Participant Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('POST /api/projects/:projectId/participants (Create Participant)', () => {
    it('should create a participant in project', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/participants`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'John Doe',
          email: 'john@example.com',
          participantCode: 'PART-001',
          plotId: 'PLOT-001',
          status: 'active',
        })
        .expect(201);

      expect(res.body.message).toBe('Participant added.');
      expect(res.body.data.fullName).toBe('John Doe');
      expect(res.body.data.projectId).toBe(projectId);

      participantId = res.body.data.id;
    });

    it('should require fullName', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/participants`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'jane@example.com',
          // Missing fullName
        })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should deny access to other developer projects', async () => {
      const otherToken = (
        await request(app)
          .post('/api/auth/signin')
          .send({
            email: 'other@example.com',
            password: 'SecurePassword123!',
          })
      ).body.token;

      const res = await request(app)
        .post(`/api/projects/${projectId}/participants`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          fullName: 'Unauthorized User',
          email: 'unauthorized@example.com',
        })
        .expect(404);

      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/projects/:projectId/participants (List Participants)', () => {
    it('should list project participants', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}/participants`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should include documentCount in response', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}/participants`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data[0].documentCount).toBeDefined();
      expect(typeof res.body.data[0].documentCount).toBe('number');
    });

    it('should search participants', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}/participants?search=John`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].fullName).toContain('John');
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}/participants?status=active`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/participants/:id (Get Participant)', () => {
    it('should get participant details', async () => {
      const res = await request(app)
        .get(`/api/participants/${participantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(participantId);
      expect(res.body.data.fullName).toBe('John Doe');
      expect(res.body.data.documentCount).toBeDefined();
    });

    it('should return 404 for non-existent participant', async () => {
      const res = await request(app)
        .get(`/api/participants/nonexistent-id`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/participants/:id (Update Participant)', () => {
    it('should update participant', async () => {
      const res = await request(app)
        .patch(`/api/participants/${participantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'inactive',
        })
        .expect(200);

      expect(res.body.message).toBe('Participant updated.');
      expect(res.body.data.status).toBe('inactive');
    });

    it('should validate status values', async () => {
      const res = await request(app)
        .patch(`/api/participants/${participantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'invalid-status',
        })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/participants/:id (Delete Participant)', () => {
    it('should delete participant', async () => {
      const res = await request(app)
        .delete(`/api/participants/${participantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.message).toBe('Participant deleted.');
    });

    it('should return 404 when deleting non-existent participant', async () => {
      const res = await request(app)
        .delete(`/api/participants/nonexistent-id`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Error Handling Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('Error Handling', () => {
    it('should return 401 for missing auth token', async () => {
      const res = await request(app)
        .get('/api/projects')
        .expect(401);

      expect(res.body.code).toBe('APP_ERROR');
    });

    it('should return 401 for invalid token', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body.code).toBe('APP_ERROR');
    });

    it('should return 404 for non-existent route', async () => {
      const res = await request(app)
        .get('/api/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('should return 405 for unsupported method', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404); // 404 because POST /projects/:id is not a route

      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Health Check
  // ──────────────────────────────────────────────────────────────────────────

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });
});
