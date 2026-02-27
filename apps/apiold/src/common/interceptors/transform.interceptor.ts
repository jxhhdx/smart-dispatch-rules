import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { I18nService } from 'nestjs-i18n';

export interface Response<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  constructor(private readonly i18n: I18nService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const lang =
      (request.query.lang as string) ||
      request.headers['accept-language'] ||
      request.headers['x-locale'] as string ||
      'zh-CN';

    return next.handle().pipe(
      switchMap(async (data) => {
        const message = await this.i18n.t('common.message.success', { lang });
        return {
          code: 200,
          message: message as string,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
