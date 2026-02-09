import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { PrismaClient } from '@prisma/client';
import { MockData } from '../../utils/mock.data';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaClient;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaClient,
          useValue: new PrismaClient(),
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
            verify: jest.fn().mockReturnValue({ sub: 'test-user-id' }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaClient>(PrismaClient);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const mockUser = {
        id: 'test-id',
        username: MockData.users.admin.username,
        passwordHash: await bcrypt.hash(MockData.users.admin.password, 10),
        status: 1,
        role: {
          code: 'super_admin',
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.validateUser(
        MockData.users.admin.username,
        MockData.users.admin.password,
      );

      expect(result).toBeDefined();
      expect(result.username).toBe(MockData.users.admin.username);
    });

    it('should return null for invalid credentials', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.validateUser('invalid', 'wrong');
      expect(result).toBeNull();
    });

    it('should return null for disabled user', async () => {
      const mockUser = {
        id: 'test-id',
        username: 'disabled',
        passwordHash: await bcrypt.hash('password', 10),
        status: 0,
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.validateUser('disabled', 'password');
      expect(result).toBeNull();
    });

    it('should return null for wrong password', async () => {
      const mockUser = {
        id: 'test-id',
        username: MockData.users.admin.username,
        passwordHash: await bcrypt.hash('correctpassword', 10),
        status: 1,
        role: { code: 'super_admin' },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.validateUser(
        MockData.users.admin.username,
        'wrongpassword',
      );
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const mockUser = {
        id: 'test-id',
        username: MockData.users.admin.username,
        email: 'admin@test.com',
        realName: '管理员',
        role: {
          id: 'role-id',
          name: '超级管理员',
          code: 'super_admin',
        },
      };

      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUser as any);

      const result = await service.login(mockUser as any);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user.username).toBe(MockData.users.admin.username);
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should update last login time', async () => {
      const mockUser = {
        id: 'test-id',
        username: 'admin',
        email: 'admin@test.com',
        role: { code: 'super_admin' },
      };

      const updateSpy = jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUser as any);

      await service.login(mockUser as any);

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile with permissions', async () => {
      const mockUser = {
        id: 'test-id',
        username: 'admin',
        email: 'admin@test.com',
        passwordHash: 'hash',
        role: {
          id: 'role-id',
          name: '超级管理员',
          code: 'super_admin',
          permissions: [
            { permission: { code: 'user:read' } },
            { permission: { code: 'user:write' } },
          ],
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.getProfile('test-id');

      expect(result).toBeDefined();
      expect(result.username).toBe('admin');
      expect(result).toHaveProperty('permissions');
      expect(result.permissions).toContain('user:read');
      expect(result.permissions).toContain('user:write');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getProfile('invalid-id')).rejects.toThrow('用户不存在');
    });

    it('should return empty permissions if role has no permissions', async () => {
      const mockUser = {
        id: 'test-id',
        username: 'admin',
        email: 'admin@test.com',
        passwordHash: 'hash',
        role: {
          id: 'role-id',
          name: '超级管理员',
          code: 'super_admin',
          permissions: [],
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.getProfile('test-id');

      expect(result.permissions).toEqual([]);
    });
  });
});
