/**
 * Fastify Educator Alerts Routes Tests
 */

import { FastifyInstance } from 'fastify';
import { createFastifyApp } from '../app';

describe('Educator Alerts Fastify Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createFastifyApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/educator-alerts/health'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.health).toBeDefined();
      expect(data.message).toBe('Health status retrieved successfully');
    });
  });

  describe('Route Registration', () => {
    it('should have educator alerts routes registered', async () => {
      const routes = app.printRoutes();
      
      expect(routes).toContain('/api/educator-alerts/recommendations');
      expect(routes).toContain('/api/educator-alerts/send');
      expect(routes).toContain('/api/educator-alerts/schedule');
      expect(routes).toContain('/api/educator-alerts/track-effectiveness');
      expect(routes).toContain('/api/educator-alerts/health');
    });
  });

  describe('Authentication Required', () => {
    it('should require authentication for protected routes', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/educator-alerts/recommendations',
        payload: {
          studentId: 'test-student',
          analysisData: {},
          educationalContext: {}
        }
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Authentication required');
    });
  });

  describe('Schema Validation', () => {
    it('should validate request schemas', async () => {
      // Mock authenticated user
      const mockUser = { id: 'educator-123', role: 'educator' };
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/educator-alerts/recommendations',
        payload: {
          // Missing required fields
          invalidField: 'invalid'
        },
        headers: {
          authorization: 'Bearer mock-token'
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('CORS Configuration', () => {
    it('should handle CORS properly', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/educator-alerts/health',
        headers: {
          origin: 'http://localhost:5173'
        }
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/educator-alerts/nonexistent'
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.payload);
      expect(data.error).toBeDefined();
      expect(data.error.statusCode).toBe(404);
    });
  });
});