import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaTestUtils } from '../utils/prisma.utils';
import { MockData, generateRandomUser } from '../utils/mock.data';
import * as bcrypt from 'bcryptjs';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prismaUtils: PrismaTestUtils;
  let accessToken: string;
  let adminRoleId: string;

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
    adminRoleId = role.id;

    await prismaUtils.createTestUser({
      username: MockData.users.admin.username,
      email: MockData.users.admin.email,
      passwordHash: await bcrypt.hash(MockData.users.admin.password, 10),
      roleId: adminRoleId,
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

  afterEach(async () => {
    await prismaUtils.cleanDatabase();
  });

  afterAll(async () => {
    await prismaUtils.disconnect();
    await app.close();
  });

  describe('GET /api/v1/users', () => {
    it('should return user list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('list');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users?page=1&pageSize=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(5);
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create new user', async () => {
      const newUser = generateRandomUser();

      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: newUser.username,
          email: newUser.email,
          password: newUser.password,
          roleId: adminRoleId,
        })
        .expect(201);

      expect(response.body.code).toBe(200);
      expect(response.body.data.username).toBe(newUser.username);
    });

    it('should fail with duplicate username', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: MockData.users.admin.username,
          email: 'different@test.com',
          password: 'password123',
          roleId: adminRoleId,
        })
        .expect(409);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return user by id', async () => {
      const users = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`);

      const userId = users.body.data.list[0].id;

      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.id).toBe(userId);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should update user', async () => {
      const users = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`);

      const userId = users.body.data.list[0].id;

      const response = await request(app.getHttpServer())
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          realName: 'Updated Name',
        })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.realName).toBe('Updated Name');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete user', async () => {
      const newUser = generateRandomUser();
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: newUser.username,
          email: newUser.email,
          password: newUser.password,
          roleId: adminRoleId,
        });

      const userId = createResponse.body.data.id;

      await request(app.getHttpServer())
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
