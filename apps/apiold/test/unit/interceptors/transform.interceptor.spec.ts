import { Test, TestingModule } from '@nestjs/testing';
import { TransformInterceptor } from '../../../src/common/interceptors/transform.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { of, lastValueFrom } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;
  let i18nService: I18nService;

  const mockI18nService = {
    t: jest.fn((key: string, options?: any) => {
      const translations: Record<string, string> = {
        'common.message.success': '操作成功',
        'error.common.internalError': '服务器内部错误',
      };
      return Promise.resolve(translations[key] || key);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransformInterceptor,
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    interceptor = module.get<TransformInterceptor<any>>(TransformInterceptor);
    i18nService = module.get<I18nService>(I18nService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (query = {}, headers = {}): ExecutionContext => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          query,
          headers,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  describe('intercept', () => {
    it('should be defined', () => {
      expect(interceptor).toBeDefined();
    });

    it('should transform response with default language (zh-CN)', async () => {
      const mockData = { id: '1', name: 'Test' };
      const mockContext = createMockExecutionContext();
      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of(mockData)),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);
      const result = await lastValueFrom(result$);

      expect(result).toHaveProperty('code', 200);
      expect(result).toHaveProperty('message', '操作成功');
      expect(result).toHaveProperty('data', mockData);
      expect(result).toHaveProperty('timestamp');
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should use language from query parameter', async () => {
      const mockData = { result: 'success' };
      const mockContext = createMockExecutionContext({ lang: 'en-US' });
      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of(mockData)),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);
      await lastValueFrom(result$);

      expect(mockI18nService.t).toHaveBeenCalledWith('common.message.success', { lang: 'en-US' });
    });

    it('should use language from accept-language header', async () => {
      const mockData = { result: 'success' };
      const mockContext = createMockExecutionContext({}, { 'accept-language': 'ja-JP' });
      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of(mockData)),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);
      await lastValueFrom(result$);

      expect(mockI18nService.t).toHaveBeenCalledWith('common.message.success', { lang: 'ja-JP' });
    });

    it('should use language from x-locale header', async () => {
      const mockData = { result: 'success' };
      const mockContext = createMockExecutionContext({}, { 'x-locale': 'ko-KR' });
      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of(mockData)),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);
      await lastValueFrom(result$);

      expect(mockI18nService.t).toHaveBeenCalledWith('common.message.success', { lang: 'ko-KR' });
    });

    it('should prioritize query parameter over header', async () => {
      const mockData = { result: 'success' };
      const mockContext = createMockExecutionContext({ lang: 'de-DE' }, { 'accept-language': 'fr-FR' });
      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of(mockData)),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);
      await lastValueFrom(result$);

      expect(mockI18nService.t).toHaveBeenCalledWith('common.message.success', { lang: 'de-DE' });
    });

    it('should handle array data', async () => {
      const mockData = [{ id: '1' }, { id: '2' }];
      const mockContext = createMockExecutionContext();
      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of(mockData)),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);
      const result = await lastValueFrom(result$);

      expect(result.data).toEqual(mockData);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should handle null data', async () => {
      const mockContext = createMockExecutionContext();
      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of(null)),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);
      const result = await lastValueFrom(result$);

      expect(result.data).toBeNull();
      expect(result.code).toBe(200);
    });

    it('should handle empty object data', async () => {
      const mockData = {};
      const mockContext = createMockExecutionContext();
      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of(mockData)),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);
      const result = await lastValueFrom(result$);

      expect(result.data).toEqual({});
      expect(result.code).toBe(200);
    });

    it('should generate timestamp for each response', async () => {
      const mockData = { test: 'data' };
      const mockContext = createMockExecutionContext();
      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of(mockData)),
      };

      const beforeTime = Date.now();
      const result$ = interceptor.intercept(mockContext, mockCallHandler);
      const result = await lastValueFrom(result$);
      const afterTime = Date.now();

      const resultTimestamp = new Date(result.timestamp).getTime();
      expect(resultTimestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(resultTimestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should handle i18n translation failure gracefully', async () => {
      mockI18nService.t.mockRejectedValueOnce(new Error('Translation failed'));

      const mockData = { result: 'success' };
      const mockContext = createMockExecutionContext();
      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of(mockData)),
      };

      await expect(lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))).rejects.toThrow();
    });

    it('should handle nested object data', async () => {
      const mockData = {
        user: { id: '1', profile: { name: 'Test' } },
        permissions: ['read', 'write'],
      };
      const mockContext = createMockExecutionContext();
      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of(mockData)),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);
      const result = await lastValueFrom(result$);

      expect(result.data).toEqual(mockData);
      expect(result.data.user.profile.name).toBe('Test');
    });
  });
});
