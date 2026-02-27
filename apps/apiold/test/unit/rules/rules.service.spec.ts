import { Test, TestingModule } from '@nestjs/testing';
import { RulesService } from '../../../src/modules/rules/rules.service';
import { PrismaClient } from '@prisma/client';

describe('RulesService', () => {
  let service: RulesService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RulesService,
        {
          provide: PrismaClient,
          useValue: new PrismaClient(),
        },
      ],
    }).compile();

    service = module.get<RulesService>(RulesService);
    prisma = module.get<PrismaClient>(PrismaClient);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return paginated rules', async () => {
      const mockRules = [
        {
          id: '1',
          name: '规则1',
          status: 1,
          creator: { id: '1', username: 'admin' },
          updater: { id: '1', username: 'admin' },
          versions: [],
        },
      ];

      jest.spyOn(prisma.rule, 'findMany').mockResolvedValue(mockRules as any);
      jest.spyOn(prisma.rule, 'count').mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result).toHaveProperty('list');
      expect(result).toHaveProperty('pagination');
      expect(result.list).toHaveLength(1);
    });

    it('should filter rules by status', async () => {
      const mockRules = [
        { id: '1', name: '规则1', status: 1, creator: {}, updater: {}, versions: [] },
      ];

      jest.spyOn(prisma.rule, 'findMany').mockResolvedValue(mockRules as any);
      jest.spyOn(prisma.rule, 'count').mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 10, status: 1 });

      expect(result.list).toHaveLength(1);
    });

    it('should filter rules by keyword', async () => {
      const mockRules = [
        { id: '1', name: '测试规则', status: 1, creator: {}, updater: {}, versions: [] },
      ];

      jest.spyOn(prisma.rule, 'findMany').mockResolvedValue(mockRules as any);
      jest.spyOn(prisma.rule, 'count').mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 10, keyword: '测试' });

      expect(result.list).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a rule by id', async () => {
      const mockRule = {
        id: '1',
        name: '规则1',
        status: 1,
        creator: { id: '1', username: 'admin' },
        updater: { id: '1', username: 'admin' },
        versions: [],
      };

      jest.spyOn(prisma.rule, 'findUnique').mockResolvedValue(mockRule as any);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect(result?.name).toBe('规则1');
    });

    it('should throw NotFoundException for non-existent rule', async () => {
      jest.spyOn(prisma.rule, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow('规则不存在');
    });
  });

  describe('create', () => {
    it('should create a new rule', async () => {
      const createRuleDto = {
        name: '新规则',
        description: '规则描述',
      };

      const mockRule = {
        id: 'new-id',
        ...createRuleDto,
        createdBy: 'user-id',
        updatedBy: 'user-id',
      };

      jest.spyOn(prisma.rule, 'create').mockResolvedValue(mockRule as any);

      const result = await service.create(createRuleDto as any, 'user-id');

      expect(result).toBeDefined();
      expect(result.name).toBe('新规则');
    });
  });

  describe('update', () => {
    it('should update an existing rule', async () => {
      const updateRuleDto = {
        name: '更新后的规则',
        description: '更新后的描述',
      };

      const mockRule = {
        id: '1',
        ...updateRuleDto,
        updatedBy: 'user-id',
      };

      jest.spyOn(prisma.rule, 'findUnique').mockResolvedValue({ id: '1' } as any);
      jest.spyOn(prisma.rule, 'update').mockResolvedValue(mockRule as any);

      const result = await service.update('1', updateRuleDto as any, 'user-id');

      expect(result).toBeDefined();
      expect(result.name).toBe('更新后的规则');
    });
  });

  describe('remove', () => {
    it('should delete a rule', async () => {
      jest.spyOn(prisma.rule, 'findUnique').mockResolvedValue({ id: '1' } as any);
      jest.spyOn(prisma.rule, 'delete').mockResolvedValue({ id: '1' } as any);

      await expect(service.remove('1')).resolves.not.toThrow();
    });
  });

  describe('publishVersion', () => {
    it('should publish a version', async () => {
      jest.spyOn(prisma.ruleVersion, 'findUnique').mockResolvedValue({ 
        id: 'version-id', 
        ruleId: 'rule-id',
        status: 0,
      } as any);
      jest.spyOn(prisma.ruleVersion, 'updateMany').mockResolvedValue({ count: 1 } as any);
      jest.spyOn(prisma.ruleVersion, 'update').mockResolvedValue({
        id: 'version-id',
        status: 1,
      } as any);
      jest.spyOn(prisma.rule, 'update').mockResolvedValue({
        id: 'rule-id',
        versionId: 'version-id',
      } as any);

      const result = await service.publishVersion('rule-id', 'version-id', 'user-id');

      expect(result).toBeDefined();
    });
  });
});
