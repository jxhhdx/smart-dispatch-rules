import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { UsersPage } from '../pages/UsersPage';
import { TestData, generateRandomString } from '../utils/test-data';

test.describe('用户管理功能测试', () => {
  let usersPage: UsersPage;

  test.beforeEach(async ({ page }) => {
    // 登录并导航到用户管理
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    const dashboard = new DashboardPage(page);
    await dashboard.navigateToUsers();
    
    usersPage = new UsersPage(page);
    await usersPage.expectLoaded();
  });

  test('✅ 创建新用户', async ({ page }) => {
    const newUser = {
      username: `test_${generateRandomString(6)}`,
      email: generateRandomString(8) + '@test.com',
      password: 'Test123!',
      realName: 'Test User',
    };

    await usersPage.createUser(newUser);
    
    // 验证用户创建成功
    await usersPage.searchUser(newUser.username);
    const hasUser = await usersPage.hasUser(newUser.username);
    expect(hasUser).toBe(true);
    
    // 验证提示信息
    await expect(page.locator('.ant-message-success')).toContainText('success');
  });

  test('❌ 创建重复用户名的用户失败', async ({ page }) => {
    // 先创建一个用户
    const username = `duplicate_${generateRandomString(6)}`;
    const user1 = {
      username,
      email: 'email1@test.com',
      password: 'Test123!',
    };
    await usersPage.createUser(user1);

    // 尝试创建同名用户
    const user2 = {
      username, // 相同的用户名
      email: 'email2@test.com',
      password: 'Test123!',
    };
    
    await usersPage.clickAdd();
    await usersPage.fillUserForm(user2);
    await usersPage.selectRole('超级管理员');
    await usersPage.saveUser();

    // 应该显示错误
    await expect(page.locator('.ant-message-error')).toBeVisible();
  });

  test('🔍 搜索用户功能', async ({ page }) => {
    // 创建特定用户用于搜索
    const uniqueUsername = `search_test_${generateRandomString(6)}`;
    await usersPage.createUser({
      username: uniqueUsername,
      email: 'search@test.com',
      password: 'Test123!',
    });

    // 搜索
    await usersPage.searchUser(uniqueUsername);
    
    // 验证搜索结果
    const rowCount = await usersPage.getTableRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(1);
    expect(await usersPage.hasUser(uniqueUsername)).toBe(true);
  });

  test('✏️ 编辑用户信息', async ({ page }) => {
    // 创建用户
    const username = `edit_test_${generateRandomString(6)}`;
    await usersPage.createUser({
      username,
      email: 'edit@test.com',
      password: 'Test123!',
    });

    // 搜索并点击编辑
    await usersPage.searchUser(username);
    const row = page.locator('.ant-table-row').filter({
      has: page.locator(`text=${username}`),
    });
    await row.locator('button:has-text("Edit")').click();

    // 修改信息
    const newRealName = 'Updated Name';
    await page.locator('input#realName').fill(newRealName);
    await usersPage.saveUser();

    // 验证更新成功
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('🗑️ 删除用户', async ({ page }) => {
    // 创建要删除的用户
    const username = `delete_test_${generateRandomString(6)}`;
    await usersPage.createUser({
      username,
      email: 'delete@test.com',
      password: 'Test123!',
    });

    // 搜索并删除
    await usersPage.searchUser(username);
    await usersPage.deleteUser(username);

    // 验证删除成功
    await expect(page.locator('.ant-message-success')).toBeVisible();
    
    // 确认用户已删除
    await page.reload();
    const hasUser = await usersPage.hasUser(username);
    expect(hasUser).toBe(false);
  });

  test('📄 分页功能', async ({ page }) => {
    // 检查分页控件
    const pagination = page.locator('.ant-pagination');
    await expect(pagination).toBeVisible();

    // 如果有多页，测试翻页
    const nextButton = page.locator('.ant-pagination-next');
    if (await nextButton.isEnabled().catch(() => false)) {
      await nextButton.click();
      await page.waitForTimeout(500);
      
      // 验证页面变化
      const activePage = page.locator('.ant-pagination-item-active');
      await expect(activePage).not.toHaveText('1');
    }
  });

  test('📊 表格排序功能', async ({ page }) => {
    // 点击表头排序
    const usernameHeader = page.locator('th:has-text("Username")');
    await usernameHeader.click();
    
    // 验证排序图标变化
    await expect(page.locator('.ant-table-column-sorter-up.active')).toBeVisible();
    
    // 再次点击反向排序
    await usernameHeader.click();
    await expect(page.locator('.ant-table-column-sorter-down.active')).toBeVisible();
  });
});
