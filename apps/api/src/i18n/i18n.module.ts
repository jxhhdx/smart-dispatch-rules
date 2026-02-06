import { Module, Global } from '@nestjs/common';
import {
  I18nModule as NestI18nModule,
  I18nJsonLoader,
  QueryResolver,
  HeaderResolver,
  CookieResolver,
} from 'nestjs-i18n';
import * as path from 'path';

@Global()
@Module({
  imports: [
    NestI18nModule.forRoot({
      fallbackLanguage: 'zh-CN',
      fallbacks: {
        'zh-*': 'zh-CN',
        'en-*': 'en-US',
        'ja-*': 'ja-JP',
        'ko-*': 'ko-KR',
      },
      loader: I18nJsonLoader,
      loaderOptions: {
        path: path.join(__dirname),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'locale'] },
        new HeaderResolver(['accept-language', 'x-locale']),
        new CookieResolver(['locale']),
      ],
      typesOutputPath: path.join(
        __dirname,
        '../../src/generated/i18n.generated.ts',
      ),
    }),
  ],
  exports: [NestI18nModule],
})
export class I18nConfigModule {}
