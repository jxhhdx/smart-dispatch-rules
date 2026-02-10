import { Test, TestingModule } from '@nestjs/testing';
import { RulesController } from '../../../src/modules/rules/rules.controller';
import { RulesService } from '../../../src/modules/rules/rules.service';
import { CreateRuleDto, UpdateRuleDto } from '../../../src/modules/rules/dto/rule.dto';
import { NotFoundException } from '@nestjs/common';

describe('RulesController', () => {
  let controller: RulesController;
  let service: RulesService;

  const mockRulesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockRequest = {
    user: { userId: 'test-user-id' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RulesController],
      providers: [
        {
          provide: RulesService,
          useValue: mockRulesService,
        },
      ],
    }).compile();

    controller = module.get<RulesController>(RulesController);
    service = module.get<RulesService>(RulesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /rules (findAll)', () => {
    it('should return paginated rules with default params', async () => {
      const mockResult = {
        list: [
          { id: '1', name: 'Rule 1', status: 1 },
          { id: '2', name: 'Rule 2', status: 0 },
        ],
        pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
      };

      mockRulesService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(undefined, undefined, undefined, undefined);

      expect(result).toEqual(mockResult);
      expect(mockRulesService.findAll).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        status: undefined,
        keyword: undefined,
      });
    });

    it('should parse query parameters correctly', async () => {
      const mockResult = {
        list: [{ id: '1', name: 'Distance Rule', status: 1 }],
        pagination: { page: 2, pageSize: 10, total: 1, totalPages: 1 },
      };

      mockRulesService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll('2', '10', '1', 'distance');

      expect(result).toEqual(mockResult);
      expect(mockRulesService.findAll).toHaveBeenCalledWith({
        page: 2,
        pageSize: 10,
        status: 1,
        keyword: 'distance',
      });
    });

    it('should handle filter by status only', async () => {
      const mockResult = {
        list: [{ id: '1', name: 'Active Rule', status: 1 }],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      };

      mockRulesService.findAll.mockResolvedValue(mockResult);

      await controller.findAll(undefined, undefined, '1', undefined);

      expect(mockRulesService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 1 }),
      );
    });

    it('should return empty list when no rules match', async () => {
      const mockResult = {
        list: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      };

      mockRulesService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(undefined, undefined, undefined, 'nonexistent');

      expect(result.list).toHaveLength(0);
    });
  });

  describe('GET /rules/:id (findOne)', () => {
    it('should return a rule by id', async () => {
      const mockRule = {
        id: '1',
        name: 'Distance Rule',
        ruleType: 'distance',
        versions: [],
      };

      mockRulesService.findOne.mockResolvedValue(mockRule);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockRule);
      expect(mockRulesService.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when rule not found', async () => {
      mockRulesService.findOne.mockRejectedValue(new NotFoundException('规则不存在'));

      await expect(controller.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('POST /rules (create)', () => {
    it('should create a new rule', async () => {
      const createRuleDto: CreateRuleDto = {
        name: 'New Rule',
        ruleType: 'distance',
        description: 'Test rule',
        priority: 100,
        businessType: 'delivery',
      };

      const mockRule = {
        id: 'new-id',
        ...createRuleDto,
        createdBy: 'test-user-id',
      };

      mockRulesService.create.mockResolvedValue(mockRule);

      const result = await controller.create(createRuleDto, mockRequest as any);

      expect(result).toEqual(mockRule);
      expect(mockRulesService.create).toHaveBeenCalledWith(createRuleDto, 'test-user-id');
    });

    it('should create rule with minimal data', async () => {
      const createRuleDto: CreateRuleDto = {
        name: 'Basic Rule',
        ruleType: 'workload',
      };

      const mockRule = {
        id: 'basic-id',
        ...createRuleDto,
      };

      mockRulesService.create.mockResolvedValue(mockRule);

      const result = await controller.create(createRuleDto, mockRequest as any);

      expect(result.name).toBe('Basic Rule');
    });
  });

  describe('PUT /rules/:id (update)', () => {
    it('should update an existing rule', async () => {
      const updateRuleDto: UpdateRuleDto = {
        name: 'Updated Rule',
        description: 'Updated description',
        priority: 90,
        status: 1,
      };

      const mockRule = {
        id: '1',
        ...updateRuleDto,
        ruleType: 'distance',
      };

      mockRulesService.update.mockResolvedValue(mockRule);

      const result = await controller.update('1', updateRuleDto, mockRequest as any);

      expect(result).toEqual(mockRule);
      expect(mockRulesService.update).toHaveBeenCalledWith('1', updateRuleDto, 'test-user-id');
    });

    it('should update rule partially', async () => {
      const updateRuleDto: UpdateRuleDto = {
        name: 'Only Name Changed',
      };

      const mockRule = {
        id: '1',
        name: 'Only Name Changed',
        ruleType: 'distance',
        description: 'Original',
      };

      mockRulesService.update.mockResolvedValue(mockRule);

      const result = await controller.update('1', updateRuleDto, mockRequest as any);

      expect(result.name).toBe('Only Name Changed');
    });

    it('should throw error when updating non-existent rule', async () => {
      const updateRuleDto: UpdateRuleDto = { name: 'Test' };
      mockRulesService.update.mockRejectedValue(new NotFoundException('规则不存在'));

      await expect(controller.update('non-existent', updateRuleDto, mockRequest as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('DELETE /rules/:id (remove)', () => {
    it('should delete a rule', async () => {
      mockRulesService.remove.mockResolvedValue({ message: '删除成功' });

      const result = await controller.remove('1');

      expect(result).toEqual({ message: '删除成功' });
      expect(mockRulesService.remove).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when deleting non-existent rule', async () => {
      mockRulesService.remove.mockRejectedValue(new NotFoundException('规则不存在'));

      await expect(controller.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
