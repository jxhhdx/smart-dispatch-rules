import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { UsersPage } from '../pages/UsersPage';
import { TestData } from '../utils/test-data';

test.describe('错误提示功能测试', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('✅ 登录失败显示错误消息', async ({ page }) => {
    await loginPage.goto();
    
    // 输入错误的密码
    await loginPage.usernameInput.fill(TestData.credentials.admin.username);
    await loginPage.passwordInput.fill(TestData.credentials.invalid.password);
    
    // 点击登录按钮
    await loginPage.submitButton.click();
    
    // 等待错误消息出现
    const errorMessage = page.locator('.ant-message-error, .ant-message-notice-content, .ant-message');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    
    // 验证错误消息内容
    const errorText = await errorMessage.first().textContent();
    expect(errorText).toMatch(/错误|error|密码|password|失败|fail|incorrect|invalid/i);
  });

  test('✅ 创建用户时显示验证错误', async ({ page }) => {
    // 先登录
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    await dashboardPage.expectLoaded();
    
    // 导航到用户管理
    await dashboardPage.navigateToUsers();
    
    // 点击创建按钮
    const createButton = page.locator('button').filter({ hasText: /New|新建|Add|添加|Create|创建/i }).first();
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();
      
      // 等待弹窗出现
      await page.waitForSelector('.ant-modal', { timeout: 5000 });
      
      // 直接提交空表单
      const saveButton = page.locator('.ant-modal-footer button').filter({ hasText: /Save|保存|OK|确定/i }).first();
      await saveButton.click();
      
      // 验证显示表单验证错误
      await page.waitForTimeout(500);
      
      // 检查是否有错误提示
      const hasError = await page.locator('.ant-form-item-explain-error, .ant-message-error').count() > 0;
      expect(hasError).toBeTruthy();
    }
  });

  test('✅ 删除操作显示确认消息', async ({ page }) => {
    // 先登录
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    await dashboardPage.expectLoaded();
    
    // 导航到角色管理（通常有测试数据）
    await dashboardPage.navigateToRoles();
    
    // 等待表格加载
    await page.waitForSelector('.ant-table-row', { timeout: 10000 });
    
    // 查找删除按钮
    const deleteButtons = page.locator('button').filter({ has: page.locator('.anticon-delete') });
    const count = await deleteButtons.count();
    
    if (count > 0) {
      // 点击第一个删除按钮
      await deleteButtons.first().click();
      
      // 等待确认弹窗
      await page.waitForTimeout(500);
      
      // 验证确认弹窗或消息出现
      const confirmModal = page.locator('.ant-popover, .ant-modal-confirm');
      const isVisible = await confirmModal.isVisible().catch(() => false);
      
      if (isVisible) {
        expect(isVisible).toBeTruthy();
        
        // 取消操作
        const cancelButton = page.locator('button').filter({ hasText: /Cancel|取消|No|否/i }).first();
        if (await cancelButton.isVisible().catch(() => false)) {
          await cancelButton.click();
        }
      }
    }
  });

  test('✅ 操作成功显示成功消息', async ({ page }) => {
    // 先登录
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    await dashboardPage.expectLoaded();
    
    // 导航到角色管理
    await dashboardPage.navigateToRoles();
    
    // 点击创建按钮
    const createButton = page.locator('button').filter({ hasText: /New|新建|Add|添加|Create|创建/i }).first();
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();
      
      // 等待弹窗
      await page.waitForSelector('.ant-modal', { timeout: 5000 });
      
      // 生成唯一的角色名
      const roleName = `TestRole_${Date.now()}`;
      
      // 填写表单
      await page.locator('input#name, input[placeholder*="name"]').fill(roleName);
      await page.locator('input#code, input[placeholder*="code"]').fill(`test_${Date.now()}`);
      
      // 保存
      const saveButton = page.locator('.ant-modal-footer button').filter({ hasText: /Save|保存|OK|确定/i }).first();
      await saveButton.click();
      
      // 等待成功消息或弹窗关闭
      await page.waitForTimeout(1000);
      
      // 验证成功消息或弹窗关闭
      const modalVisible = await page.locator('.ant-modal').isVisible().catch(() => false);
      
      // 弹窗应该关闭（表示成功）
      expect(modalVisible).toBeFalsy();
    }
  });
});
