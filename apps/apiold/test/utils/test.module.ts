import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

/**
 * 测试专用模块
 * 提供测试所需的依赖注入
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'test-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [PrismaClient, JwtModule],
})
export class TestModule {}
