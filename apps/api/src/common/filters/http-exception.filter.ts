import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // 获取语言，优先从 query 或 header 获取
    const lang = 
      (request.query.lang as string) || 
      request.headers['accept-language'] || 
      request.headers['x-locale'] as string ||
      'zh-CN';

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    let message = exceptionResponse.message || exceptionResponse.error;
    
    // 如果消息是 i18n key，则进行翻译
    if (typeof message === 'string' && message.includes('.')) {
      try {
        const translated = await this.i18n.t(message, { lang });
        if (translated !== message) {
          message = translated;
        }
      } catch {
        // 翻译失败，使用原消息
      }
    }

    // 处理验证错误数组
    let errors = undefined;
    if (exceptionResponse.errors && Array.isArray(exceptionResponse.errors)) {
      errors = await Promise.all(
        exceptionResponse.errors.map(async (err: any) => ({
          field: err.property || err.field,
          message: await this.translateValidationError(err, lang),
          constraints: err.constraints,
        })),
      );
    }

    response.status(status).json({
      code: status,
      message: message || 'Internal server error',
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private async translateValidationError(error: any, lang: string): Promise<string> {
    if (error.constraints && Object.keys(error.constraints).length > 0) {
      const firstConstraint = Object.values(error.constraints)[0] as string;
      // 尝试翻译验证错误消息
      try {
        const translated = await this.i18n.t(firstConstraint, { lang });
        return (translated as string) !== firstConstraint ? (translated as string) : firstConstraint;
      } catch {
        return firstConstraint;
      }
    }
    return error.message || 'Validation failed';
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const lang = 
      (request.query.lang as string) || 
      request.headers['accept-language'] || 
      request.headers['x-locale'] as string ||
      'zh-CN';

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : await this.i18n.t('error.common.internalError', { lang });

    response.status(status).json({
      code: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
