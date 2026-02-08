import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 加载本地环境变量
 */
function loadEnvFile() {
  const envPath = path.resolve(__dirname, '.env.playwright');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^#][^=]*)=(.*)$/);
      if (match) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    });
  }
}
loadEnvFile();

/**
 * Playwright 配置文件
 * 用于前端 E2E 测试
 */
export default defineConfig({
  testDir: './e2e/tests',

  /* 并行运行测试 */
  fullyParallel: true,

  /* 失败时保留输出 */
  forbidOnly: !!process.env.CI,

  /* 重试次数 */
  retries: process.env.CI ? 2 : 0,

  /* 并行工作进程数 */
  workers: process.env.CI ? 1 : undefined,

  /* 报告器 */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  /* 共享配置 */
  use: {
    /* 基础 URL */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* 截图配置 */
    screenshot: 'only-on-failure',

    /* 视频录制 */
    video: 'on-first-retry',

    /* 追踪 */
    trace: 'on-first-retry',

    /* 视口大小 */
    viewport: { width: 1280, height: 720 },

    /* 超时 */
    actionTimeout: 15000,
    navigationTimeout: 15000,
  },

  /* 项目配置 */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // 如需指定本地 Chromium 路径，设置环境变量 PLAYWRIGHT_CHROMIUM_PATH
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
        } : {},
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* 移动端测试 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 本地开发服务器 */
  webServer: {
    command: 'cd apps/web && npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
