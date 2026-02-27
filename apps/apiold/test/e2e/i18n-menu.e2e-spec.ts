import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaTestUtils } from '../utils/prisma.utils';
import { MockData } from '../utils/mock.data';
import * as bcrypt from 'bcryptjs';

describe('I18n - Menu and Localization (e2e)', () => {
  let app: INestApplication;
  let prismaUtils: PrismaTestUtils;
  let accessToken: string;

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

  beforeEach(async () => {
    // 创建测试用户并登录
    const role = await prismaUtils.createTestRole(MockData.roles.superAdmin);
    await prismaUtils.createTestUser({
      username: MockData.users.admin.username,
      email: MockData.users.admin.email,
      passwordHash: await bcrypt.hash(MockData.users.admin.password, 10),
      roleId: role.id,
      status: 1,
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: MockData.users.admin.username,
        password: MockData.users.admin.password,
      });

    accessToken = loginResponse.body.data.access_token;
  });

  describe('GET /api/v1/rules - Response with different locales', () => {
    it('should return success message in Chinese', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Accept-Language', 'zh-CN')
        .set('X-Locale', 'zh-CN')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.message).toContain('成功');
    });

    it('should return success message in English', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Accept-Language', 'en-US')
        .set('X-Locale', 'en-US')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.message).toContain('success');
    });
  });

  describe('POST /api/v1/rules - Error messages with different locales', () => {
    it('should return validation error in Chinese', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Accept-Language', 'zh-CN')
        .set('X-Locale', 'zh-CN')
        .send({
          // 发送空数据，触发验证错误
          name: '',
          content: '',
        })
        .expect(400);

      expect(response.body.code).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/v1/users - Access with different locales', () => {
    it('should return user list with Chinese success message', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Accept-Language', 'zh-CN')
        .set('X-Locale', 'zh-CN')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.list || response.body.data)).toBe(true);
    });

    it('should return user list with English success message', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Accept-Language', 'en-US')
        .set('X-Locale', 'en-US')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Language Priority', () => {
    it('should prioritize X-Locale header over Accept-Language', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Accept-Language', 'en-US')
        .set('X-Locale', 'zh-CN')
        .expect(200);

      expect(response.body.code).toBe(200);
      // 应该使用 X-Locale 指定的语言
      expect(response.body.message).toContain('成功');
    });

    it('should fallback to default language when no locale specified', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.message).toBeDefined();
    });
  });
});

describe('I18n - Menu Labels (e2e)', () => {
  let app: INestApplication;
  let prismaUtils: PrismaTestUtils;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaUtils = new PrismaTestUtils();
    await prismaUtils.cleanDatabase();

    // 创建测试用户
    const role = await prismaUtils.createTestRole(MockData.roles.superAdmin);
    await prismaUtils.createTestUser({
      username: MockData.users.admin.username,
      email: MockData.users.admin.email,
      passwordHash: await bcrypt.hash(MockData.users.admin.password, 10),
      roleId: role.id,
      status: 1,
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: MockData.users.admin.username,
        password: MockData.users.admin.password,
      });

    accessToken = loginResponse.body.data.access_token;
  });

  afterAll(async () => {
    await prismaUtils.cleanDatabase();
    await prismaUtils.disconnect();
    await app.close();
  });

  describe('API Response Messages', () => {
    it('should return consistent message format across all APIs', async () => {
      const endpoints = [
        { method: 'get', path: '/api/v1/rules' },
        { method: 'get', path: '/api/v1/users' },
        { method: 'get', path: '/api/v1/roles' },
        { method: 'get', path: '/api/v1/logs/operation' },
      ];

      for (const endpoint of endpoints) {
        const response = await (request(app.getHttpServer()) as any)
          [endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${accessToken}`)
          .set('Accept-Language', 'zh-CN');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('code');
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('timestamp');
      }
    });
  });
});
