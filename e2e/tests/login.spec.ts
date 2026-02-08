import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TestData } from '../utils/test-data';

test.describe('登录功能测试', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('✅ 使用正确凭据登录成功', async ({ page }) => {
    await loginPage.loginAsAdmin();
    
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
    
    // 验证用户信息显示
    await expect(page.locator('text=admin')).toBeVisible();
  });

  test('❌ 使用错误密码登录失败', async () => {
    await loginPage.login(
      TestData.credentials.admin.username,
      TestData.credentials.invalid.password
    );
    
    await loginPage.expectError();
    await expect(loginPage.errorMessage).toContainText('Invalid username or password');
  });

  test('❌ 使用不存在的用户名登录失败', async () => {
    await loginPage.login(
      TestData.credentials.invalid.username,
      'anypassword'
    );
    
    await loginPage.expectError();
  });

  test('❌ 空表单提交显示验证错误', async () => {
    await loginPage.clickSubmit();
    
    // 检查是否有验证错误提示
    const errorMessages = await page.locator('.ant-form-item-explain-error').count();
    expect(errorMessages).toBeGreaterThan(0);
  });

  test('👁️ 密码显示/隐藏切换', async () => {
    const passwordInput = loginPage.passwordInput;
    
    // 默认应该是密码类型
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // 点击显示密码按钮（如果有的话）
    const eyeIcon = page.locator('.ant-input-suffix .anticon-eye');
    if (await eyeIcon.isVisible().catch(() => false)) {
      await eyeIcon.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });

  test('🔄 页面刷新后保持登录状态', async ({ page, context }) => {
    await loginPage.loginAsAdmin();
    
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
    
    // 刷新页面
    await page.reload();
    
    // 应该仍然显示 Dashboard，而不是跳转到登录页
    await expect(page.locator('h2:has-text("Dashboard")')).toBeVisible();
  });
});
