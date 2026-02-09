import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from '../../../src/modules/roles/roles.service';
import { PrismaClient } from '@prisma/client';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: PrismaClient,
          useValue: new PrismaClient(),
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    prisma = module.get<PrismaClient>(PrismaClient);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      const mockRoles = [
        {
          id: '1',
          name: '超级管理员',
          code: 'super_admin',
          description: '系统所有权限',
          status: 1,
        },
        {
          id: '2',
          name: '普通用户',
          code: 'user',
          description: '普通用户权限',
          status: 1,
        },
      ];

      jest.spyOn(prisma.role, 'findMany').mockResolvedValue(mockRoles as any);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('super_admin');
    });
  });

  describe('findOne', () => {
    it('should return a role by id', async () => {
      const mockRole = {
        id: '1',
        name: '超级管理员',
        code: 'super_admin',
        description: '系统所有权限',
        status: 1,
        permissions: [
          { permission: { id: '1', code: 'user:read', name: '查看用户' } },
        ],
      };

      jest.spyOn(prisma.role, 'findUnique').mockResolvedValue(mockRole as any);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect(result?.code).toBe('super_admin');
    });

    it('should throw NotFoundException for non-existent role', async () => {
      jest.spyOn(prisma.role, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow('角色不存在');
    });
  });

  describe('create', () => {
    it('should create a new role', async () => {
      const createRoleDto = {
        name: '测试角色',
        code: 'test_role',
        description: '测试用角色',
        permissionIds: ['1', '2'],
      };

      const mockRole = {
        id: 'new-id',
        name: createRoleDto.name,
        code: createRoleDto.code,
        description: createRoleDto.description,
        status: 1,
      };

      jest.spyOn(prisma.role, 'create').mockResolvedValue(mockRole as any);
      jest.spyOn(prisma.rolePermission, 'createMany').mockResolvedValue({ count: 2 } as any);

      const result = await service.create(createRoleDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('测试角色');
    });
  });

  describe('update', () => {
    it('should update an existing role', async () => {
      const updateRoleDto = {
        name: '更新后的角色名',
        description: '更新后的描述',
        permissionIds: ['1', '2', '3'],
      };

      const mockRole = {
        id: '1',
        code: 'super_admin',
        ...updateRoleDto,
        status: 1,
      };

      jest.spyOn(prisma.role, 'findUnique').mockResolvedValue({ id: '1' } as any);
      jest.spyOn(prisma.role, 'update').mockResolvedValue(mockRole as any);
      jest.spyOn(prisma.rolePermission, 'deleteMany').mockResolvedValue({ count: 0 } as any);
      jest.spyOn(prisma.rolePermission, 'createMany').mockResolvedValue({ count: 3 } as any);

      const result = await service.update('1', updateRoleDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('更新后的角色名');
    });
  });

  describe('remove', () => {
    it('should delete a role when no users are using it', async () => {
      jest.spyOn(prisma.role, 'findUnique').mockResolvedValue({ 
        id: '1',
        users: [], // 没有用户使用该角色
      } as any);
      jest.spyOn(prisma.role, 'delete').mockResolvedValue({ id: '1' } as any);

      const result = await service.remove('1');
      
      expect(result).toHaveProperty('message', '删除成功');
    });

    it('should throw error when role has users', async () => {
      jest.spyOn(prisma.role, 'findUnique').mockResolvedValue({ 
        id: '1',
        users: [{ id: 'user1' }], // 有用户使用该角色
      } as any);

      await expect(service.remove('1')).rejects.toThrow('该角色下还有用户，无法删除');
    });
  });

  describe('findAllPermissions', () => {
    it('should return all permissions', async () => {
      const mockPermissions = [
        { id: '1', code: 'user:read', name: '查看用户', module: 'user' },
        { id: '2', code: 'user:write', name: '编辑用户', module: 'user' },
        { id: '3', code: 'role:read', name: '查看角色', module: 'role' },
      ];

      jest.spyOn(prisma.permission, 'findMany').mockResolvedValue(mockPermissions as any);

      const result = await service.findAllPermissions();

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('code');
      expect(result[0]).toHaveProperty('module');
    });
  });
});
