import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { RolesPage } from '../pages/RolesPage';
import { generateRandomString } from '../utils/test-data';

test.describe('角色管理测试', () => {
  let rolesPage: RolesPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    const dashboard = new DashboardPage(page);
    await dashboard.navigateToRoles();
    
    rolesPage = new RolesPage(page);
  });

  test('角色列表页面显示正常', async ({ page }) => {
    await expect(page.locator('text=Role Management').first()).toBeVisible();
    await expect(page.locator('.ant-table')).toBeVisible();
  });

  test('创建新角色', async () => {
    const roleName = `角色_${generateRandomString()}`;
    await rolesPage.createRole({
      name: roleName,
      code: `ROLE_${generateRandomString().toUpperCase()}`,
      description: '测试角色',
    });
    
    await rolesPage.page.reload();
    const exists = await rolesPage.hasRole(roleName);
    expect(exists).toBe(true);
  });

  test('删除角色', async () => {
    const roleName = `删除_${generateRandomString()}`;
    await rolesPage.createRole({
      name: roleName,
      code: `ROLE_${generateRandomString().toUpperCase()}`,
    });
    
    await rolesPage.page.reload();
    await rolesPage.deleteRole(roleName);
    
    await rolesPage.page.reload();
    const exists = await rolesPage.hasRole(roleName);
    expect(exists).toBe(false);
  });
});
