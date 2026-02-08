import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from '../../../src/modules/roles/roles.service';
import { PrismaClient } from '@prisma/client';
import { MockData } from '../../utils/mock.data';

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
        { id: '1', ...MockData.roles.superAdmin },
        { id: '2', ...MockData.roles.operator },
      ];

      jest.spyOn(prisma.role, 'findMany').mockResolvedValue(mockRoles as any);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return role by id with permissions', async () => {
      const mockRole = {
        id: 'test-id',
        ...MockData.roles.superAdmin,
        permissions: [
          { permission: { id: 'perm-1', name: '用户管理' } },
        ],
      };

      jest.spyOn(prisma.role, 'findUnique').mockResolvedValue(mockRole as any);

      const result = await service.findOne('test-id');

      expect(result).toBeDefined();
      expect(result.name).toBe(MockData.roles.superAdmin.name);
      expect(result.permissions).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create new role', async () => {
      const newRole = {
        name: '测试角色',
        code: 'test_role',
        description: '测试用角色',
      };

      jest.spyOn(prisma.role, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.role, 'create').mockResolvedValue({
        id: 'new-id',
        ...newRole,
        status: 1,
      } as any);

      const result = await service.create(newRole);

      expect(result).toBeDefined();
      expect(result.code).toBe('test_role');
    });

    it('should throw error if role code exists', async () => {
      jest.spyOn(prisma.role, 'findUnique').mockResolvedValue({
        id: 'existing',
        code: MockData.roles.superAdmin.code,
      } as any);

      await expect(
        service.create({
          name: '重复角色',
          code: MockData.roles.superAdmin.code,
        }),
      ).rejects.toThrow();
    });
  });

  describe('updatePermissions', () => {
    it('should update role permissions', async () => {
      const permissionIds = ['perm-1', 'perm-2'];

      jest.spyOn(prisma.role, 'findUnique').mockResolvedValue({
        id: 'role-id',
      } as any);
      jest.spyOn(prisma.rolePermission, 'deleteMany').mockResolvedValue({ count: 0 } as any);
      jest.spyOn(prisma.rolePermission, 'createMany').mockResolvedValue({ count: 2 } as any);
      jest.spyOn(prisma.role, 'findUnique').mockResolvedValue({
        id: 'role-id',
        permissions: permissionIds.map(id => ({
          permission: { id, name: `Perm ${id}` },
        })),
      } as any);

      const result = await service.updatePermissions('role-id', permissionIds);

      expect(result).toBeDefined();
      expect(prisma.rolePermission.createMany).toHaveBeenCalled();
    });
  });

  describe('getAllPermissions', () => {
    it('should return all permissions', async () => {
      jest.spyOn(prisma.permission, 'findMany').mockResolvedValue(
        MockData.permissions as any,
      );

      const result = await service.getAllPermissions();

      expect(result).toHaveLength(MockData.permissions.length);
    });
  });
});
