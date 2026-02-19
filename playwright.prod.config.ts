import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 线上环境测试配置
 * 用于测试已部署的 Vercel 环境
 */
export default defineConfig({
  testDir: './e2e/tests',

  /* 串行运行测试（避免相互影响） */
  fullyParallel: false,
  workers: 1,

  /* 失败时保留输出 */
  forbidOnly: !!process.env.CI,

  /* 重试次数（线上环境可能需要重试） */
  retries: 2,

  /* 报告器 */
  reporter: [
    ['html', { outputFolder: 'playwright-report-prod' }],
    ['list'],
  ],

  /* 共享配置 */
  use: {
    /* 线上环境基础 URL */
    baseURL: 'https://web-o9a5z01n1-javon-gaos-projects.vercel.app',

    /* 截图配置 */
    screenshot: 'on',

    /* 视频录制 */
    video: 'on',

    /* 追踪 */
    trace: 'on',

    /* 视口大小 */
    viewport: { width: 1280, height: 720 },

    /* 超时（线上环境可能较慢） */
    actionTimeout: 20000,
    navigationTimeout: 20000,
  },

  /* 项目配置 - 只使用 Chromium 加快测试速度 */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        },
      },
    },
  ],

  /* 不启动本地服务器 */
  // webServer 被省略
});
