import { Test, TestingModule } from '@nestjs/testing';
import {
  HttpExceptionFilter,
  AllExceptionsFilter,
} from '../../../src/common/filters/http-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Response, Request } from 'express';

describe('HttpExceptionFilter', () => {
  let httpExceptionFilter: HttpExceptionFilter;
  let allExceptionsFilter: AllExceptionsFilter;

  const mockI18nService = {
    t: jest.fn((key: string, options?: any) => {
      const translations: Record<string, string> = {
        'error.common.internalError': '服务器内部错误',
        'error.user.notFound': '用户不存在',
        'error.validation.required': '该字段为必填项',
      };
      return Promise.resolve(translations[key] || key);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpExceptionFilter,
        AllExceptionsFilter,
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    httpExceptionFilter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
    allExceptionsFilter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('HttpExceptionFilter', () => {
    it('should be defined', () => {
      expect(httpExceptionFilter).toBeDefined();
    });

    it('should handle HttpException and return proper response structure', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const mockRequest = {
        url: '/test-url',
        query: {},
        headers: {},
      } as unknown as Request;

      const host = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
      await httpExceptionFilter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 400,
          timestamp: expect.any(String),
          path: '/test-url',
        }),
      );
    });

    it('should handle HttpException with object response', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const mockRequest = {
        url: '/test',
        query: {},
        headers: {},
      } as unknown as Request;

      const host = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      const exception = new HttpException(
        { message: 'Validation failed', error: 'Bad Request' },
        HttpStatus.BAD_REQUEST,
      );

      await httpExceptionFilter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 400,
        }),
      );
    });

    it('should handle validation errors with array', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const mockRequest = {
        url: '/test',
        query: {},
        headers: {},
      } as unknown as Request;

      const host = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      const validationErrors = [
        { property: 'username', constraints: { isNotEmpty: '用户名不能为空' } },
        { property: 'email', constraints: { isEmail: '邮箱格式不正确' } },
      ];
      const exception = new BadRequestException({
        message: 'Validation failed',
        errors: validationErrors,
      });

      await httpExceptionFilter.catch(exception, host);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.code).toBe(400);
      expect(jsonCall.errors).toBeDefined();
      expect(Array.isArray(jsonCall.errors)).toBe(true);
    });

    it('should handle different HTTP status codes', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const mockRequest = {
        url: '/test',
        query: {},
        headers: {},
      } as unknown as Request;

      const host = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      await httpExceptionFilter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 403,
        }),
      );
    });

    it('should handle HttpException with 404 status', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const mockRequest = {
        url: '/test',
        query: {},
        headers: {},
      } as unknown as Request;

      const host = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
      await httpExceptionFilter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 404,
        }),
      );
    });

    it('should handle HttpException with 401 status', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const mockRequest = {
        url: '/test',
        query: {},
        headers: {},
      } as unknown as Request;

      const host = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      await httpExceptionFilter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 401,
        }),
      );
    });

    it('should include path in error response', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const mockRequest = {
        url: '/api/users/123',
        query: {},
        headers: {},
      } as unknown as Request;

      const host = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);
      await httpExceptionFilter.catch(exception, host);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/users/123',
        }),
      );
    });

    it('should handle empty error message', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const mockRequest = {
        url: '/test',
        query: {},
        headers: {},
      } as unknown as Request;

      const host = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      const exception = new HttpException('', HttpStatus.BAD_REQUEST);
      await httpExceptionFilter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('AllExceptionsFilter', () => {
    it('should be defined', () => {
      expect(allExceptionsFilter).toBeDefined();
    });

    it('should handle generic Error as internal server error', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const mockRequest = {
        url: '/test',
        query: {},
        headers: {},
      } as unknown as Request;

      const host = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      const exception = new Error('Unexpected error');
      await allExceptionsFilter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 500,
          message: '服务器内部错误',
          timestamp: expect.any(String),
          path: '/test',
        }),
      );
    });

    it('should handle HttpException with AllExceptionsFilter', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const mockRequest = {
        url: '/test',
        query: {},
        headers: {},
      } as unknown as Request;

      const host = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
      await allExceptionsFilter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 404,
          message: 'Not Found',
        }),
      );
    });

    it('should handle unknown exceptions as internal server error', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const mockRequest = {
        url: '/api/test',
        query: {},
        headers: {},
      } as unknown as Request;

      const host = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      // Test with a string (not an Error instance)
      await allExceptionsFilter.catch('string error', host);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockI18nService.t).toHaveBeenCalledWith('error.common.internalError', { lang: 'zh-CN' });
    });

    it('should handle null exception', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const mockRequest = {
        url: '/test',
        query: {},
        headers: {},
      } as unknown as Request;

      const host = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      await allExceptionsFilter.catch(null, host);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should include timestamp in error response', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const mockRequest = {
        url: '/test',
        query: {},
        headers: {},
      } as unknown as Request;

      const host = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      const beforeTime = Date.now();
      await allExceptionsFilter.catch(new Error('Test'), host);
      const afterTime = Date.now();

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      const resultTimestamp = new Date(jsonCall.timestamp).getTime();
      expect(resultTimestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(resultTimestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should use language from query parameter', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const mockRequest = {
        url: '/test',
        query: { lang: 'en-US' },
        headers: {},
      } as unknown as Request;

      const host = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      const exception = new Error('Test error');
      await allExceptionsFilter.catch(exception, host);

      expect(mockI18nService.t).toHaveBeenCalledWith('error.common.internalError', { lang: 'en-US' });
    });
  });
});
