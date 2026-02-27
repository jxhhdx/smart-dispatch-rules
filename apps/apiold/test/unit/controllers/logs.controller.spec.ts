import { Test, TestingModule } from '@nestjs/testing';
import { LogsController } from '../../../src/modules/logs/logs.controller';
import { LogsService } from '../../../src/modules/logs/logs.service';

describe('LogsController', () => {
  let controller: LogsController;
  let service: LogsService;

  const mockLogsService = {
    findSystemLogs: jest.fn(),
    findLoginLogs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogsController],
      providers: [
        {
          provide: LogsService,
          useValue: mockLogsService,
        },
      ],
    }).compile();

    controller = module.get<LogsController>(LogsController);
    service = module.get<LogsService>(LogsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /logs/operation (findSystemLogs)', () => {
    it('should return system logs with default pagination', async () => {
      const mockResult = {
        list: [
          { id: '1', module: 'auth', action: 'login', username: 'admin' },
          { id: '2', module: 'user', action: 'create', username: 'admin' },
        ],
        pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
      };

      mockLogsService.findSystemLogs.mockResolvedValue(mockResult);

      const result = await controller.findSystemLogs(undefined, undefined, undefined, undefined, undefined, undefined);

      expect(result).toEqual(mockResult);
      expect(mockLogsService.findSystemLogs).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        module: undefined,
        action: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should parse query parameters correctly', async () => {
      const mockResult = {
        list: [{ id: '1', module: 'auth', action: 'login' }],
        pagination: { page: 2, pageSize: 10, total: 1, totalPages: 1 },
      };

      mockLogsService.findSystemLogs.mockResolvedValue(mockResult);

      const result = await controller.findSystemLogs('2', '10', 'auth', 'login', '2024-01-01', '2024-12-31');

      expect(result).toEqual(mockResult);
      expect(mockLogsService.findSystemLogs).toHaveBeenCalledWith({
        page: 2,
        pageSize: 10,
        module: 'auth',
        action: 'login',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
    });

    it('should handle empty result', async () => {
      const mockResult = {
        list: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      };

      mockLogsService.findSystemLogs.mockResolvedValue(mockResult);

      const result = await controller.findSystemLogs(undefined, undefined, 'nonexistent', undefined, undefined, undefined);

      expect(result.list).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle service error', async () => {
      mockLogsService.findSystemLogs.mockRejectedValue(new Error('Database error'));

      await expect(controller.findSystemLogs(undefined, undefined, undefined, undefined, undefined, undefined)).rejects.toThrow('Database error');
    });

    it('should filter logs by module only', async () => {
      const mockResult = {
        list: [{ id: '1', module: 'auth', action: 'login' }],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      };

      mockLogsService.findSystemLogs.mockResolvedValue(mockResult);

      await controller.findSystemLogs(undefined, undefined, 'auth', undefined, undefined, undefined);

      expect(mockLogsService.findSystemLogs).toHaveBeenCalledWith(
        expect.objectContaining({ module: 'auth' }),
      );
    });
  });

  describe('GET /logs/login (findLoginLogs)', () => {
    it('should return login logs with default pagination', async () => {
      const mockResult = {
        list: [
          { id: '1', username: 'admin', status: 1 },
          { id: '2', username: 'user1', status: 0 },
        ],
        pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
      };

      mockLogsService.findLoginLogs.mockResolvedValue(mockResult);

      const result = await controller.findLoginLogs(undefined, undefined, undefined, undefined, undefined, undefined);

      expect(result).toEqual(mockResult);
      expect(mockLogsService.findLoginLogs).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        username: undefined,
        status: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should parse query parameters including status', async () => {
      const mockResult = {
        list: [{ id: '1', username: 'admin', status: 1 }],
        pagination: { page: 1, pageSize: 15, total: 1, totalPages: 1 },
      };

      mockLogsService.findLoginLogs.mockResolvedValue(mockResult);

      const result = await controller.findLoginLogs('1', '15', 'admin', '1', '2024-01-01', '2024-12-31');

      expect(result).toEqual(mockResult);
      expect(mockLogsService.findLoginLogs).toHaveBeenCalledWith({
        page: 1,
        pageSize: 15,
        username: 'admin',
        status: 1,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
    });

    it('should handle status as undefined when empty string provided', async () => {
      const mockResult = {
        list: [{ id: '1', username: 'admin' }],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      };

      mockLogsService.findLoginLogs.mockResolvedValue(mockResult);

      await controller.findLoginLogs(undefined, undefined, undefined, '', undefined, undefined);

      expect(mockLogsService.findLoginLogs).toHaveBeenCalledWith(
        expect.objectContaining({ status: undefined }),
      );
    });

    it('should filter login logs by username', async () => {
      const mockResult = {
        list: [{ id: '1', username: 'admin' }],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      };

      mockLogsService.findLoginLogs.mockResolvedValue(mockResult);

      await controller.findLoginLogs(undefined, undefined, 'admin', undefined, undefined, undefined);

      expect(mockLogsService.findLoginLogs).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'admin' }),
      );
    });

    it('should handle service error for login logs', async () => {
      mockLogsService.findLoginLogs.mockRejectedValue(new Error('Service unavailable'));

      await expect(controller.findLoginLogs(undefined, undefined, undefined, undefined, undefined, undefined)).rejects.toThrow('Service unavailable');
    });
  });
});
