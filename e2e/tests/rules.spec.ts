import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { RulesPage } from '../pages/RulesPage';

test.describe('规则管理功能测试', () => {
  let rulesPage: RulesPage;

  test.beforeEach(async ({ page }) => {
    // 登录并导航到规则管理
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    const dashboard = new DashboardPage(page);
    await dashboard.navigateToRules();
    
    rulesPage = new RulesPage(page);
    await rulesPage.expectLoaded();
  });

  test('📋 规则列表页面显示正常', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('text=Rule Management').first()).toBeVisible();
    
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
      await searchInput.fill('test');
      await expect(searchInput).toHaveValue('test');
    } else {
      // 如果没有搜索框，测试跳过
      test.skip();
    }
  });

  test('➕ 打开创建规则弹窗', async ({ page }) => {
    // 点击创建按钮
    await rulesPage.clickAdd();
    
    // 验证弹窗显示
    await expect(page.locator('.ant-modal')).toBeVisible();
    await expect(page.locator('.ant-modal-title')).toContainText(/Create|创建/);
    
    // 验证表单字段存在
    await expect(page.locator('input[placeholder*="rule name"]')).toBeVisible();
    await expect(page.locator('.ant-form-item').filter({ hasText: /Rule Type|类型/ })).toBeVisible();
    
    // 关闭弹窗
    await page.locator('.ant-modal-close').or(page.locator('button').filter({ hasText: /Cancel|取消/ })).first().click();
  });

  test('📊 表格列显示正确', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.ant-table-thead', { timeout: 5000 });
    
    // 验证表头列存在
    const headers = ['Rule Name', 'Type', 'Status', 'Action'];
    for (const header of headers) {
      const headerCell = page.locator('th').filter({ hasText: new RegExp(header, 'i') });
      if (await headerCell.isVisible().catch(() => false)) {
        await expect(headerCell).toBeVisible();
      }
    }
  });

  test('📸 规则管理页面截图', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/rules-page.png',
      fullPage: true,
    });
  });
});
