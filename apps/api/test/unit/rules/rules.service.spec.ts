import { Test, TestingModule } from '@nestjs/testing';
import { RulesService } from '../../../src/modules/rules/rules.service';
import { PrismaClient } from '@prisma/client';
import { MockData, generateRandomRule } from '../../utils/mock.data';

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
        { id: '1', ...MockData.rules.distanceRule },
        { id: '2', ...MockData.rules.workloadRule },
      ];

      jest.spyOn(prisma.rule, 'findMany').mockResolvedValue(mockRules as any);
      jest.spyOn(prisma.rule, 'count').mockResolvedValue(2);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result.list).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter rules by type', async () => {
      const mockRules = [
        { id: '1', ...MockData.rules.distanceRule },
      ];

      jest.spyOn(prisma.rule, 'findMany').mockResolvedValue(mockRules as any);
      jest.spyOn(prisma.rule, 'count').mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        pageSize: 10,
        ruleType: 'distance',
      });

      expect(result.list).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return rule with versions', async () => {
      const mockRule = {
        id: 'test-id',
        ...MockData.rules.distanceRule,
        versions: [
          { id: 'v1', version: 1, status: 1 },
        ],
      };

      jest.spyOn(prisma.rule, 'findUnique').mockResolvedValue(mockRule as any);

      const result = await service.findOne('test-id');

      expect(result).toBeDefined();
      expect(result.name).toBe(MockData.rules.distanceRule.name);
      expect(result.versions).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create new rule', async () => {
      const newRule = generateRandomRule();

      jest.spyOn(prisma.rule, 'create').mockResolvedValue({
        id: 'new-id',
        ...newRule,
        status: 0,
      } as any);

      const result = await service.create({
        ...newRule,
        configJson: {},
      }, 'user-id');

      expect(result).toBeDefined();
      expect(result.name).toBe(newRule.name);
    });
  });

  describe('createVersion', () => {
    it('should create new rule version', async () => {
      const mockRule = {
        id: 'rule-id',
        name: '测试规则',
        versions: [{ version: 1 }],
      };

      jest.spyOn(prisma.rule, 'findUnique').mockResolvedValue(mockRule as any);
      jest.spyOn(prisma.ruleVersion, 'create').mockResolvedValue({
        id: 'version-id',
        ruleId: 'rule-id',
        version: 2,
        configJson: {},
      } as any);

      const result = await service.createVersion('rule-id', {
        configJson: {},
        description: '版本 2',
      }, 'user-id');

      expect(result).toBeDefined();
      expect(result.version).toBe(2);
    });
  });

  describe('publishVersion', () => {
    it('should publish rule version', async () => {
      const mockVersion = {
        id: 'version-id',
        ruleId: 'rule-id',
        version: 1,
        status: 0,
      };

      jest.spyOn(prisma.ruleVersion, 'findUnique').mockResolvedValue(mockVersion as any);
      jest.spyOn(prisma.ruleVersion, 'update').mockResolvedValue({
        ...mockVersion,
        status: 1,
        publishedAt: new Date(),
      } as any);
      jest.spyOn(prisma.rule, 'update').mockResolvedValue({
        id: 'rule-id',
        versionId: 'version-id',
        status: 1,
      } as any);

      const result = await service.publishVersion('version-id', 'user-id');

      expect(result).toBeDefined();
      expect(prisma.ruleVersion.update).toHaveBeenCalled();
    });
  });

  describe('simulateRule', () => {
    it('should simulate rule execution', async () => {
      const mockInput = {
        orderId: 'order-123',
        distance: 5.5,
        riderLocations: [
          { riderId: 'r1', distance: 2.0 },
          { riderId: 'r2', distance: 3.5 },
        ],
      };

      const result = await service.simulate(mockInput);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('matchedRules');
    });
  });
});
