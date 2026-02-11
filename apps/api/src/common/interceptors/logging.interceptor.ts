import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LogsService } from '../../modules/logs/logs.service';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const SKIP_LOG_KEY = 'skipLog';

// 自定义装饰器，用于跳过日志记录
export const SkipLog = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(SKIP_LOG_KEY, true, descriptor.value);
  };
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private logsService: LogsService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const skipLog = this.reflector.get<boolean>(SKIP_LOG_KEY, handler);

    if (skipLog) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();
    const user = (request as any).user;
    const method = request.method;
    const url = request.url;
    const body = request.body;
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] || '';

    // 只记录修改操作（POST, PUT, DELETE）
    const isModifyOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    
    // 跳过登录相关的日志（登录有专门的登录日志）
    const isAuthEndpoint = url.includes('/auth/');

    return next.handle().pipe(
      tap(async () => {
        if (isModifyOperation && !isAuthEndpoint && user) {
          try {
            const action = this.getActionDescription(method, url);
            const module = this.getModuleName(url);
            
            await this.logsService.createSystemLog({
              userId: user.userId || user.sub,
              username: user.username || 'unknown',
              action,
              module,
              description: `${action} - ${url}`,
              params: body,
              ipAddress,
              userAgent,
            });
          } catch (error) {
            // 日志记录失败不应影响主业务
            console.error('Failed to create system log:', error);
          }
        }
      }),
    );
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return (forwarded as string).split(',')[0].trim();
    }
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private getActionDescription(method: string, url: string): string {
    const actionMap: Record<string, string> = {
      POST: '创建',
      PUT: '更新',
      PATCH: '修改状态',
      DELETE: '删除',
    };
    return actionMap[method] || '操作';
  }

  private getModuleName(url: string): string {
    if (url.includes('/users')) return '用户管理';
    if (url.includes('/roles')) return '角色管理';
    if (url.includes('/rules')) return '规则管理';
    if (url.includes('/logs')) return '日志管理';
    return '系统';
  }
}
