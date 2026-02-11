import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { UsersPage } from '../pages/UsersPage';
import { generateRandomString, generateRandomEmail } from '../utils/test-data';

test.describe('用户管理测试', () => {
  let usersPage: UsersPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    const dashboard = new DashboardPage(page);
    await dashboard.navigateToUsers();
    
    usersPage = new UsersPage(page);
  });

  test('用户列表页面显示正常', async ({ page }) => {
    await expect(page.locator('text=User Management').first()).toBeVisible();
    await expect(page.locator('.ant-table')).toBeVisible();
  });

  test('创建新用户', async () => {
    const username = `test_${generateRandomString()}`;
    await usersPage.createUser({
      username,
      email: generateRandomEmail(),
      password: 'Test123!',
      realName: '测试用户',
    });
    
    await usersPage.page.reload();
    const exists = await usersPage.hasUser(username);
    expect(exists).toBe(true);
  });

  test('删除用户', async () => {
    const username = `delete_${generateRandomString()}`;
    await usersPage.createUser({
      username,
      email: generateRandomEmail(),
      password: 'Test123!',
    });
    
    await usersPage.page.reload();
    await usersPage.deleteUser(username);
    
    await usersPage.page.reload();
    const exists = await usersPage.hasUser(username);
    expect(exists).toBe(false);
  });
});
