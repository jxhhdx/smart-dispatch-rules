import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LogsPage } from '../pages/LogsPage';

test.describe('日志审计测试', () => {
  let logsPage: LogsPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    const dashboard = new DashboardPage(page);
    await dashboard.navigateToLogs();
    
    logsPage = new LogsPage(page);
  });

  test('日志页面显示正常', async ({ page }) => {
    await expect(page.locator('text=System Logs').first()).toBeVisible();
    await expect(page.locator('.ant-table')).toBeVisible();
  });

  test('搜索日志功能', async () => {
    await logsPage.searchLogs('admin');
    // 验证页面不报错
    await expect(logsPage.table).toBeVisible();
  });

  test('按模块筛选日志', async () => {
    await logsPage.filterByModule('rules');
    await expect(logsPage.table).toBeVisible();
  });
});
