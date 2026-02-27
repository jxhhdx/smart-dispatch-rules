import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../../src/modules/users/users.controller';
import { UsersService } from '../../../src/modules/users/users.service';
import { CreateUserDto, UpdateUserDto } from '../../../src/modules/users/dto/user.dto';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users (findAll)', () => {
    it('should return paginated user list with default params', async () => {
      const mockResult = {
        list: [
          { id: '1', username: 'admin', realName: 'Admin', role: { name: 'Admin' } },
          { id: '2', username: 'user1', realName: 'User 1', role: { name: 'User' } },
        ],
        pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
      };

      mockUsersService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(undefined, undefined, undefined);

      expect(result).toEqual(mockResult);
      expect(mockUsersService.findAll).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        keyword: undefined,
      });
    });

    it('should parse query parameters correctly', async () => {
      const mockResult = {
        list: [{ id: '1', username: 'admin', realName: 'Admin User' }],
        pagination: { page: 2, pageSize: 10, total: 1, totalPages: 1 },
      };

      mockUsersService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll('2', '10', 'admin');

      expect(result).toEqual(mockResult);
      expect(mockUsersService.findAll).toHaveBeenCalledWith({
        page: 2,
        pageSize: 10,
        keyword: 'admin',
      });
    });

    it('should handle keyword search', async () => {
      const mockResult = {
        list: [{ id: '1', username: 'testuser', realName: 'Test User' }],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      };

      mockUsersService.findAll.mockResolvedValue(mockResult);

      await controller.findAll(undefined, undefined, 'test');

      expect(mockUsersService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: 'test' }),
      );
    });

    it('should return empty list when no users match', async () => {
      const mockResult = {
        list: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      };

      mockUsersService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(undefined, undefined, 'nonexistent');

      expect(result.list).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('GET /users/:id (findOne)', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        id: '1',
        username: 'admin',
        email: 'admin@test.com',
        realName: 'Administrator',
        role: { name: 'Admin' },
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findOne.mockRejectedValue(new NotFoundException('用户不存在'));

      await expect(controller.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('POST /users (create)', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'password123',
        realName: 'New User',
        phone: '13800138000',
        roleId: 'role-id',
      };

      const mockUser = {
        id: 'new-id',
        username: 'newuser',
        email: 'newuser@test.com',
        realName: 'New User',
        role: { name: 'User' },
      };

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should create user with minimal data', async () => {
      const createUserDto: CreateUserDto = {
        username: 'basicuser',
        email: 'basic@test.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'basic-id',
        username: 'basicuser',
        email: 'basic@test.com',
        role: null,
      };

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(result.username).toBe('basicuser');
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('PUT /users/:id (update)', () => {
    it('should update an existing user', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'updated@test.com',
        realName: 'Updated Name',
        phone: '13900139000',
        roleId: 'new-role-id',
      };

      const mockUser = {
        id: '1',
        username: 'user1',
        ...updateUserDto,
        role: { name: 'Updated Role' },
      };

      mockUsersService.update.mockResolvedValue(mockUser);

      const result = await controller.update('1', updateUserDto);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.update).toHaveBeenCalledWith('1', updateUserDto);
    });

    it('should update user partially', async () => {
      const updateUserDto: UpdateUserDto = {
        realName: 'Only Real Name Updated',
      };

      const mockUser = {
        id: '1',
        username: 'user1',
        realName: 'Only Real Name Updated',
        email: 'original@test.com',
        role: { name: 'User' },
      };

      mockUsersService.update.mockResolvedValue(mockUser);

      const result = await controller.update('1', updateUserDto);

      expect(result.realName).toBe('Only Real Name Updated');
      expect(result.email).toBe('original@test.com');
    });

    it('should throw error when updating non-existent user', async () => {
      const updateUserDto: UpdateUserDto = { realName: 'Test' };
      mockUsersService.update.mockRejectedValue(new NotFoundException('用户不存在'));

      await expect(controller.update('non-existent', updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('DELETE /users/:id (remove)', () => {
    it('should delete a user', async () => {
      mockUsersService.remove.mockResolvedValue({ message: '删除成功' });

      const result = await controller.remove('1');

      expect(result).toEqual({ message: '删除成功' });
      expect(mockUsersService.remove).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when deleting non-existent user', async () => {
      mockUsersService.remove.mockRejectedValue(new NotFoundException('用户不存在'));

      await expect(controller.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('PUT /users/:id/status (updateStatus)', () => {
    it('should update user status to disabled', async () => {
      const mockUser = {
        id: '1',
        username: 'user1',
        status: 0,
        role: { name: 'User' },
      };

      mockUsersService.updateStatus.mockResolvedValue(mockUser);

      const result = await controller.updateStatus('1', 0);

      expect(result.status).toBe(0);
      expect(mockUsersService.updateStatus).toHaveBeenCalledWith('1', 0);
    });

    it('should update user status to enabled', async () => {
      const mockUser = {
        id: '1',
        username: 'user1',
        status: 1,
        role: { name: 'User' },
      };

      mockUsersService.updateStatus.mockResolvedValue(mockUser);

      const result = await controller.updateStatus('1', 1);

      expect(result.status).toBe(1);
      expect(mockUsersService.updateStatus).toHaveBeenCalledWith('1', 1);
    });
  });
});
