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
        passwordHash: MockData.users.admin.passwordHash,
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

      const result = await service.login(mockUser as any);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user.username).toBe(MockData.users.admin.username);
      expect(jwtService.sign).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should handle logout gracefully', async () => {
      const result = await service.logout('test-user-id');
      expect(result).toBeDefined();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token for valid user', async () => {
      const mockUser = {
        id: 'test-id',
        username: 'admin',
        role: { code: 'super_admin' },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.refreshToken('test-id');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
    });

    it('should throw error for non-existent user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.refreshToken('invalid-id')).rejects.toThrow();
    });
  });
});
