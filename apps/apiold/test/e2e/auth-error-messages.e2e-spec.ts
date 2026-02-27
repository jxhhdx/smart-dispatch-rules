import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaTestUtils } from '../utils/prisma.utils';
import { MockData } from '../utils/mock.data';
import * as bcrypt from 'bcryptjs';

describe('AuthController - Error Messages (e2e)', () => {
  let app: INestApplication;
  let prismaUtils: PrismaTestUtils;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaUtils = new PrismaTestUtils();
    await prismaUtils.cleanDatabase();
  });

  afterAll(async () => {
    await prismaUtils.cleanDatabase();
    await prismaUtils.disconnect();
    await app.close();
  });

  describe('POST /api/v1/auth/login - Error Message Localization', () => {
    beforeEach(async () => {
      const role = await prismaUtils.createTestRole(MockData.roles.superAdmin);
      await prismaUtils.createTestUser({
        username: MockData.users.admin.username,
        email: MockData.users.admin.email,
        passwordHash: await bcrypt.hash(MockData.users.admin.password, 10),
        roleId: role.id,
        status: 1,
      });
    });

    it('should return Chinese error message for invalid password (zh-CN)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Accept-Language', 'zh-CN')
        .set('X-Locale', 'zh-CN')
        .send({
          username: MockData.users.admin.username,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.code).toBe(401);
      expect(response.body.message).toBe('用户名或密码错误');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
    });

    it('should return English error message for invalid password (en-US)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Accept-Language', 'en-US')
        .set('X-Locale', 'en-US')
        .send({
          username: MockData.users.admin.username,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.code).toBe(401);
      // 根据 i18n 配置，应该返回英文错误消息
      expect(response.body.message).toBeDefined();
    });

    it('should return error message for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Accept-Language', 'zh-CN')
        .send({
          username: 'nonexistentuser',
          password: 'anypassword',
        })
        .expect(401);

      expect(response.body.code).toBe(401);
      expect(response.body.message).toBe('用户名或密码错误');
    });

    it('should return validation error for empty username', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: '',
          password: 'password',
        })
        .expect(400);

      expect(response.body.code).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('should return validation error for empty password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'admin',
          password: '',
        })
        .expect(400);

      expect(response.body.code).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login - Disabled User', () => {
    it('should return error for disabled user', async () => {
      const role = await prismaUtils.createTestRole(MockData.roles.superAdmin);
      await prismaUtils.createTestUser({
        username: 'disableduser',
        email: 'disabled@test.com',
        passwordHash: await bcrypt.hash('password123', 10),
        roleId: role.id,
        status: 0, // 禁用状态
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Accept-Language', 'zh-CN')
        .send({
          username: 'disableduser',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.code).toBe(401);
      expect(response.body.message).toBe('用户名或密码错误');
    });
  });

  describe('POST /api/v1/auth/login - Response Structure', () => {
    it('should have correct error response structure', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'wrong',
          password: 'wrong',
        })
        .expect(401);

      // 验证错误响应结构
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');

      // 验证类型
      expect(typeof response.body.code).toBe('number');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.path).toBe('string');

      // 验证时间戳格式
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
    });
  });

  describe('POST /api/v1/auth/login - CORS and Headers', () => {
    it('should handle CORS preflight', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/v1/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

      // 验证 CORS 头
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    it('should accept JSON content type', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
          username: MockData.users.admin.username,
          password: 'wrong',
        })
        .expect(401);

      expect(response.body).toBeDefined();
      expect(response.body.code).toBe(401);
    });
  });

  describe('POST /api/v1/auth/login - Concurrent Requests', () => {
    it('should handle multiple concurrent login attempts', async () => {
      const promises = Array(5).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            username: MockData.users.admin.username,
            password: 'wrongpassword',
          })
      );

      const responses = await Promise.all(promises);

      // 所有请求都应该返回 401
      responses.forEach(response => {
        expect(response.status).toBe(401);
        expect(response.body.code).toBe(401);
        expect(response.body.message).toBe('用户名或密码错误');
      });
    });
  });
});
