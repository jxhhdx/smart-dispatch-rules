import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// 全局 Prisma 客户端实例，用于 Serverless 环境复用
let prismaClient: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }
  return prismaClient;
}

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useFactory: () => getPrismaClient(),
    },
  ],
  exports: [PrismaClient],
})
export class DatabaseModule implements OnModuleDestroy {
  async onModuleDestroy() {
    if (prismaClient) {
      await prismaClient.$disconnect();
      prismaClient = null;
    }
  }
}
