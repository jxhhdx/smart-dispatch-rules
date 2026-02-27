import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaTestUtils } from '../utils/prisma.utils';
import { MockData, generateRandomRule } from '../utils/mock.data';
import * as bcrypt from 'bcryptjs';

describe('RulesController (e2e)', () => {
  let app: INestApplication;
  let prismaUtils: PrismaTestUtils;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaUtils = new PrismaTestUtils();
    await prismaUtils.cleanDatabase();
  });

  beforeEach(async () => {
    const role = await prismaUtils.createTestRole(MockData.roles.superAdmin);
    const user = await prismaUtils.createTestUser({
      username: MockData.users.admin.username,
      email: MockData.users.admin.email,
      passwordHash: await bcrypt.hash(MockData.users.admin.password, 10),
      roleId: role.id,
      status: 1,
    });
    userId = user.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: MockData.users.admin.username,
        password: MockData.users.admin.password,
      });

    accessToken = loginResponse.body.data.access_token;
  });

  afterEach(async () => {
    await prismaUtils.cleanDatabase();
  });

  afterAll(async () => {
    await prismaUtils.disconnect();
    await app.close();
  });

  describe('CRUD Operations', () => {
    it('should create, read, update and delete rule', async () => {
      // Create
      const newRule = generateRandomRule();
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: newRule.name,
          ruleType: newRule.ruleType,
          priority: newRule.priority,
          description: newRule.description,
          configJson: {},
        })
        .expect(201);

      expect(createResponse.body.code).toBe(200);
      const ruleId = createResponse.body.data.id;

      // Read
      const getResponse = await request(app.getHttpServer())
        .get(`/api/v1/rules/${ruleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getResponse.body.data.name).toBe(newRule.name);

      // Update
      const updateResponse = await request(app.getHttpServer())
        .put(`/api/v1/rules/${ruleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          priority: 999,
        })
        .expect(200);

      expect(updateResponse.body.data.priority).toBe(999);

      // Delete
      await request(app.getHttpServer())
        .delete(`/api/v1/rules/${ruleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/api/v1/rules/${ruleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/rules', () => {
    beforeEach(async () => {
      await prismaUtils.createTestRule({
        name: MockData.rules.distanceRule.name,
        ruleType: MockData.rules.distanceRule.ruleType,
        priority: MockData.rules.distanceRule.priority,
        createdBy: userId,
      });
    });

    it('should return rule list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.list.length).toBeGreaterThan(0);
    });

    it('should filter by rule type', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/rules?ruleType=distance')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.list[0].ruleType).toBe('distance');
    });
  });

  describe('Rule Versions', () => {
    let ruleId: string;

    beforeEach(async () => {
      const rule = await prismaUtils.createTestRule({
        name: MockData.rules.distanceRule.name,
        ruleType: MockData.rules.distanceRule.ruleType,
        priority: 100,
        createdBy: userId,
      });
      ruleId = rule.id;
    });

    it('should create and publish rule version', async () => {
      // Create version
      const versionResponse = await request(app.getHttpServer())
        .post(`/api/v1/rules/${ruleId}/versions`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          configJson: { maxDistance: 10 },
          description: 'Version 1',
        })
        .expect(201);

      expect(versionResponse.body.code).toBe(200);
      const versionId = versionResponse.body.data.id;

      // Publish version
      const publishResponse = await request(app.getHttpServer())
        .post(`/api/v1/rules/versions/${versionId}/publish`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(publishResponse.body.code).toBe(200);
    });
  });

  describe('POST /api/v1/rules/simulate', () => {
    it('should simulate rule execution', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/rules/simulate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          orderId: 'order-123',
          distance: 5.5,
          riderLocations: [
            { riderId: 'r1', distance: 2.0, rating: 4.5 },
            { riderId: 'r2', distance: 3.5, rating: 4.8 },
          ],
        })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('result');
      expect(response.body.data).toHaveProperty('matchedRules');
    });
  });
});
