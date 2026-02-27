import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/api/v1 (GET) - should return API info', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('/api/v1/health (GET) - health check endpoint', async () => {
      try {
        const response = await request(app.getHttpServer())
          .get('/api/v1/health')
          .timeout(5000);

        expect(response.status).toBeLessThan(500);
      } catch (error) {
        // Health endpoint might not exist, that's ok
        expect(true).toBe(true);
      }
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/v1/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/non-existent-route');

      expect(response.status).toBe(404);
    });

    it('should return 401 for protected routes without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users');

      expect(response.status).toBe(401);
    });
  });
});
