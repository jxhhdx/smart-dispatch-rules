import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from '../../../src/modules/roles/roles.controller';
import { RolesService } from '../../../src/modules/roles/roles.service';
import { CreateRoleDto, UpdateRoleDto } from '../../../src/modules/roles/dto/role.dto';
import { NotFoundException } from '@nestjs/common';

describe('RolesController', () => {
  let controller: RolesController;
  let service: RolesService;

  const mockRolesService = {
    findAll: jest.fn(),
    findAllPermissions: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    service = module.get<RolesService>(RolesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /roles (findAll)', () => {
    it('should return all roles', async () => {
      const mockRoles = [
        { id: '1', name: 'Admin', code: 'admin', permissions: [] },
        { id: '2', name: 'User', code: 'user', permissions: [] },
      ];

      mockRolesService.findAll.mockResolvedValue(mockRoles);

      const result = await controller.findAll();

      expect(result).toEqual(mockRoles);
      expect(mockRolesService.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no roles exist', async () => {
      mockRolesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('GET /roles/permissions (findAllPermissions)', () => {
    it('should return all permissions', async () => {
      const mockPermissions = [
        { id: '1', name: '用户查看', code: 'user:view', status: 1 },
        { id: '2', name: '用户编辑', code: 'user:edit', status: 1 },
      ];

      mockRolesService.findAllPermissions.mockResolvedValue(mockPermissions);

      const result = await controller.findAllPermissions();

      expect(result).toEqual(mockPermissions);
      expect(mockRolesService.findAllPermissions).toHaveBeenCalled();
    });
  });

  describe('GET /roles/:id (findOne)', () => {
    it('should return a role by id', async () => {
      const mockRole = {
        id: '1',
        name: 'Admin',
        code: 'admin',
        permissions: [{ permission: { id: 'p1', name: 'View' } }],
      };

      mockRolesService.findOne.mockResolvedValue(mockRole);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockRole);
      expect(mockRolesService.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRolesService.findOne.mockRejectedValue(new NotFoundException('角色不存在'));

      await expect(controller.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('POST /roles (create)', () => {
    it('should create a new role', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'New Role',
        code: 'new_role',
        description: 'Test role',
        permissionIds: ['p1', 'p2'],
      };

      const mockRole = {
        id: 'new-id',
        ...createRoleDto,
        permissions: [{ permission: { id: 'p1' } }, { permission: { id: 'p2' } }],
      };

      mockRolesService.create.mockResolvedValue(mockRole);

      const result = await controller.create(createRoleDto);

      expect(result).toEqual(mockRole);
      expect(mockRolesService.create).toHaveBeenCalledWith(createRoleDto);
    });

    it('should create role without permissions', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'Basic Role',
        code: 'basic_role',
      };

      const mockRole = {
        id: 'basic-id',
        ...createRoleDto,
        permissions: [],
      };

      mockRolesService.create.mockResolvedValue(mockRole);

      const result = await controller.create(createRoleDto);

      expect(result.permissions).toEqual([]);
    });
  });

  describe('PUT /roles/:id (update)', () => {
    it('should update an existing role', async () => {
      const updateRoleDto: UpdateRoleDto = {
        name: 'Updated Role',
        description: 'Updated description',
        permissionIds: ['p1', 'p2', 'p3'],
      };

      const mockRole = {
        id: '1',
        ...updateRoleDto,
        code: 'admin',
        permissions: [{ permission: { id: 'p1' } }],
      };

      mockRolesService.update.mockResolvedValue(mockRole);

      const result = await controller.update('1', updateRoleDto);

      expect(result).toEqual(mockRole);
      expect(mockRolesService.update).toHaveBeenCalledWith('1', updateRoleDto);
    });

    it('should update role partially', async () => {
      const updateRoleDto: UpdateRoleDto = {
        name: 'Only Name Updated',
      };

      const mockRole = {
        id: '1',
        name: 'Only Name Updated',
        code: 'admin',
        description: 'Original description',
        permissions: [],
      };

      mockRolesService.update.mockResolvedValue(mockRole);

      const result = await controller.update('1', updateRoleDto);

      expect(result.name).toBe('Only Name Updated');
    });

    it('should throw error when updating non-existent role', async () => {
      const updateRoleDto: UpdateRoleDto = { name: 'Test' };
      mockRolesService.update.mockRejectedValue(new NotFoundException('角色不存在'));

      await expect(controller.update('non-existent', updateRoleDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('DELETE /roles/:id (remove)', () => {
    it('should delete a role', async () => {
      mockRolesService.remove.mockResolvedValue({ message: '删除成功' });

      const result = await controller.remove('1');

      expect(result).toEqual({ message: '删除成功' });
      expect(mockRolesService.remove).toHaveBeenCalledWith('1');
    });

    it('should throw error when deleting role with users', async () => {
      mockRolesService.remove.mockRejectedValue(new Error('该角色下还有用户，无法删除'));

      await expect(controller.remove('1')).rejects.toThrow('该角色下还有用户，无法删除');
    });

    it('should throw NotFoundException when deleting non-existent role', async () => {
      mockRolesService.remove.mockRejectedValue(new NotFoundException('角色不存在'));

      await expect(controller.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
