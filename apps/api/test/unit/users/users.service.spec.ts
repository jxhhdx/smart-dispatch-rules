import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../../src/modules/users/users.service';
import { PrismaClient } from '@prisma/client';

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
    it('should return paginated user list', async () => {
      const mockUsers = [
        { id: '1', username: 'user1', realName: 'User 1', role: { name: 'Admin' } },
        { id: '2', username: 'user2', realName: 'User 2', role: { name: 'User' } },
      ];

      jest.spyOn(prisma.user, 'findMany').mockResolvedValue(mockUsers as any);
      jest.spyOn(prisma.user, 'count').mockResolvedValue(2);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result).toHaveProperty('list');
      expect(result).toHaveProperty('pagination');
      expect(result.list).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter users by keyword', async () => {
      const mockUsers = [
        { id: '1', username: 'admin', realName: 'Admin User', role: { name: 'Admin' } },
      ];

      jest.spyOn(prisma.user, 'findMany').mockResolvedValue(mockUsers as any);
      jest.spyOn(prisma.user, 'count').mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 10, keyword: 'admin' });

      expect(result.list).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        id: '1',
        username: 'user1',
        realName: 'User 1',
        role: { name: 'Admin' },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect(result?.username).toBe('user1');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow('用户不存在');
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        realName: 'New User',
        roleId: 'role-id',
      };

      const mockUser = {
        id: 'new-id',
        ...createUserDto,
        role: { name: 'User' },
      };

      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser as any);

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.username).toBe('newuser');
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      const updateUserDto = {
        realName: 'Updated Name',
        email: 'updated@example.com',
        roleId: 'new-role-id',
      };

      const mockUser = {
        id: '1',
        username: 'user1',
        ...updateUserDto,
        role: { name: 'Admin' },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: '1' } as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUser as any);

      const result = await service.update('1', updateUserDto);

      expect(result).toBeDefined();
      expect(result.realName).toBe('Updated Name');
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: '1' } as any);
      jest.spyOn(prisma.user, 'delete').mockResolvedValue({ id: '1' } as any);

      await expect(service.remove('1')).resolves.not.toThrow();
    });
  });
});
