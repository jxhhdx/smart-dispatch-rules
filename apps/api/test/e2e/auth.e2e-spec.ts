import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaTestUtils } from '../utils/prisma.utils';
import { MockData } from '../utils/mock.data';
import * as bcrypt from 'bcryptjs';

describe('AuthController (e2e)', () => {
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

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // 创建测试角色
      const role = await prismaUtils.createTestRole(MockData.roles.superAdmin);
      
      // 创建测试用户
      await prismaUtils.createTestUser({
        username: MockData.users.admin.username,
        email: MockData.users.admin.email,
        passwordHash: await bcrypt.hash(MockData.users.admin.password, 10),
        roleId: role.id,
        status: 1,
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: MockData.users.admin.username,
          password: MockData.users.admin.password,
        })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data.user.username).toBe(MockData.users.admin.username);
    });

    it('should fail with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: MockData.users.admin.username,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail with non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
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

    it('should get user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.username).toBe(MockData.users.admin.username);
    });

    it('should fail without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
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

    it('should logout successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
    });
  });
});
