import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TestData } from '../utils/test-data';

test.describe('用户认证测试', () => {
  test('正常登录成功', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('错误密码登录失败', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TestData.credentials.admin.username, 'wrongpassword');
    
    await expect(page).toHaveURL(/.*login/);
  });

  test('不存在用户登录失败', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('nonexistentuser', 'password');
    
    await expect(page).toHaveURL(/.*login/);
  });

  test('登出功能正常', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    const dashboard = new DashboardPage(page);
    await dashboard.logout();
    
    await expect(page).toHaveURL(/.*login/);
  });

  test('未认证访问被重定向', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });
});
