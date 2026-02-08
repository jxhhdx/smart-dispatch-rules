import { test as baseTest, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TestData } from '../utils/test-data';

/**
 * 扩展 Playwright test 对象
 * 添加已登录的 page fixture
 */
export const test = baseTest.extend<{
  loggedInPage: {
    page: typeof baseTest.prototype;
    dashboard: DashboardPage;
  };
}>({
  // 自动登录的 fixture
  loggedInPage: async ({ page }, use) => {
    // 执行登录
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      TestData.credentials.admin.username,
      TestData.credentials.admin.password
    );
    
    // 验证登录成功
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
    
    // 提供给测试使用
    await use({ page, dashboard });
  },
});

export { expect };
