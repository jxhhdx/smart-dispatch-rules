/**
 * Jest 测试全局设置
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// 全局测试超时
jest.setTimeout(30000);

// 清理所有 mock
beforeEach(() => {
  jest.clearAllMocks();
});

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 测试完成后清理
afterAll(async () => {
  // 等待所有异步操作完成
  await new Promise(resolve => setTimeout(resolve, 500));
});
