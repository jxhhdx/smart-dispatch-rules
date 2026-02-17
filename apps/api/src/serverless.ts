import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverless from 'serverless-http';
import { AppModule } from './app.module';

// 创建 Express 实例
const server = express();

// 标记是否已初始化
let isInitialized = false;

// 初始化 NestJS 应用
async function bootstrap() {
  if (isInitialized) return;

  const adapter = new ExpressAdapter(server);
  const app = await NestFactory.create(AppModule, adapter);

  // 启用 CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // 全局前缀
  app.setGlobalPrefix('api/v1');

  // 等待应用初始化完成
  await app.init();
  
  isInitialized = true;
  console.log('NestJS application initialized for serverless');
}

// 创建 serverless handler
const handler = serverless(server);

// 导出 Vercel 函数处理器
export default async (req: any, res: any) => {
  // 确保应用已初始化
  await bootstrap();
  // 处理请求
  return handler(req, res);
};
