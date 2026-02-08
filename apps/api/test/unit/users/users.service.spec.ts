import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../../src/modules/users/users.service';
import { PrismaClient } from '@prisma/client';
import { MockData, generateRandomUser } from '../../utils/mock.data';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaClient,
          useValue: new PrismaClient(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaClient>(PrismaClient);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        { id: '1', username: 'user1', email: 'user1@test.com' },
        { id: '2', username: 'user2', email: 'user2@test.com' },
      ];

      jest.spyOn(prisma.user, 'findMany').mockResolvedValue(mockUsers as any);
      jest.spyOn(prisma.user, 'count').mockResolvedValue(2);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result.list).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter users by status', async () => {
      const mockUsers = [
        { id: '1', username: 'user1', status: 1 },
      ];

      jest.spyOn(prisma.user, 'findMany').mockResolvedValue(mockUsers as any);
      jest.spyOn(prisma.user, 'count').mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 10, status: 1 });

      expect(result.list).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 'test-id',
        username: 'admin',
        email: 'admin@test.com',
        role: { id: 'role-id', name: '超级管理员' },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.findOne('test-id');

      expect(result).toBeDefined();
      expect(result.username).toBe('admin');
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create new user', async () => {
      const newUser = generateRandomUser();
      const mockUser = {
        id: 'new-id',
        ...newUser,
        status: 1,
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser as any);

      const result = await service.create({
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
      });

      expect(result).toBeDefined();
      expect(result.username).toBe(newUser.username);
    });

    it('should throw error if username exists', async () => {
      const existingUser = {
        id: 'existing-id',
        username: MockData.users.admin.username,
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(existingUser as any);

      await expect(
        service.create({
          username: MockData.users.admin.username,
          email: 'new@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const mockUser = {
        id: 'test-id',
        username: 'updated',
        email: 'updated@test.com',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'test-id' } as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUser as any);

      const result = await service.update('test-id', {
        username: 'updated',
      });

      expect(result.username).toBe('updated');
    });
  });

  describe('remove', () => {
    it('should delete user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'test-id' } as any);
      jest.spyOn(prisma.user, 'delete').mockResolvedValue({ id: 'test-id' } as any);

      const result = await service.remove('test-id');

      expect(result).toBeDefined();
    });
  });

  describe('updateStatus', () => {
    it('should update user status', async () => {
      const mockUser = {
        id: 'test-id',
        username: 'admin',
        status: 0,
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'test-id' } as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUser as any);

      const result = await service.updateStatus('test-id', 0);

      expect(result.status).toBe(0);
    });
  });
});
