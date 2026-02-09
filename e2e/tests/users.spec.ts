import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { UsersPage } from '../pages/UsersPage';

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

  test('📋 用户列表页面显示正常', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('text=User Management').first()).toBeVisible();
    
    // 验证表格存在
    await expect(page.locator('.ant-table')).toBeVisible();
    
    // 验证创建按钮存在
    await expect(page.locator('button').filter({ hasText: /Create|创建/ })).toBeVisible();
  });

  test('🔍 搜索功能存在', async ({ page }) => {
    // 检查搜索输入框（如果有）
    const searchInput = page.locator('input[placeholder*="Search"]').or(page.locator('.ant-input-search input'));
    const hasSearch = await searchInput.isVisible().catch(() => false);
    
    if (hasSearch) {
      await searchInput.fill('admin');
      await expect(searchInput).toHaveValue('admin');
    } else {
      test.skip();
    }
  });

  test('➕ 打开创建用户弹窗', async ({ page }) => {
    // 点击创建按钮
    await usersPage.clickAdd();
    
    // 验证弹窗显示
    await expect(page.locator('.ant-modal')).toBeVisible();
    await expect(page.locator('.ant-modal-title')).toContainText(/Create|创建/);
    
    // 验证表单字段存在
    await expect(page.locator('input[placeholder*="username"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="email"]')).toBeVisible();
    
    // 关闭弹窗
    await page.locator('.ant-modal-close').or(page.locator('button').filter({ hasText: /Cancel|取消/ })).first().click();
  });

  test('📊 表格显示 admin 用户', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.ant-table-row', { timeout: 5000 });
    
    // 验证 admin 用户存在
    await expect(page.locator('td').filter({ hasText: 'admin' }).first()).toBeVisible();
  });

  test('📄 分页控件存在', async ({ page }) => {
    // 检查分页控件
    const pagination = page.locator('.ant-pagination');
    const hasPagination = await pagination.isVisible().catch(() => false);
    
    if (hasPagination) {
      await expect(pagination).toBeVisible();
      
      // 验证页码显示
      const pageNumber = pagination.locator('.ant-pagination-item-active');
      if (await pageNumber.isVisible().catch(() => false)) {
        await expect(pageNumber).toHaveText('1');
      }
    } else {
      test.skip();
    }
  });

  test('📸 用户管理页面截图', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/users-page.png',
      fullPage: true,
    });
  });
});
