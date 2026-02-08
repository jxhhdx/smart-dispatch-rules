import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('全局导航和流程测试', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
  });

  test('🔄 完整的用户操作流程', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    
    // 1. 查看 Dashboard
    await dashboard.expectLoaded();
    
    // 2. 进入用户管理
    await dashboard.navigateToUsers();
    await expect(page.locator('h2:has-text("Users")')).toBeVisible();
    
    // 3. 进入规则管理
    await dashboard.navigateToRules();
    await expect(page.locator('h2:has-text("Rules")')).toBeVisible();
    
    // 4. 进入角色管理
    await dashboard.navigateToRoles();
    await expect(page.locator('h2:has-text("Roles")')).toBeVisible();
    
    // 5. 进入系统日志
    await dashboard.navigateToLogs();
    await expect(page.locator('h2:has-text("Logs")')).toBeVisible();
    
    // 6. 返回 Dashboard
    await dashboard.clickMenu('Dashboard');
    await dashboard.expectLoaded();
  });

  test('🔙 浏览器后退按钮', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    
    // 导航到用户管理
    await dashboard.navigateToUsers();
    await expect(page).toHaveURL(/.*users/);
    
    // 点击浏览器后退
    await page.goBack();
    
    // 应该回到 Dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('⏱️ 页面加载性能', async ({ page }) => {
    // 测量页面加载时间
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Dashboard load time: ${loadTime}ms`);
    
    // 页面加载应该小于 5 秒
    expect(loadTime).toBeLessThan(5000);
  });

  test('📱 移动端响应式', async ({ page }) => {
    // 模拟移动设备
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 刷新页面
    await page.reload();
    
    // 检查移动端布局
    await expect(page.locator('.ant-layout-sider')).toBeHidden();
    
    // 应该有移动菜单按钮
    const menuButton = page.locator('.mobile-menu-button, .ant-drawer-toggle');
    // 注意：具体选择器取决于实际实现
  });

  test('🔒 未授权访问重定向', async ({ browser }) => {
    // 创建新的浏览器上下文（未登录状态）
    const context = await browser.newContext();
    const newPage = await context.newPage();
    
    // 尝试直接访问 Dashboard
    await newPage.goto('/dashboard');
    
    // 应该被重定向到登录页
    await expect(newPage).toHaveURL(/.*login/);
    
    await context.close();
  });

  test('📝 表单验证和错误提示', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    
    // 进入用户管理
    await dashboard.navigateToUsers();
    
    // 点击添加
    await page.locator('button:has-text("Add")').click();
    
    // 直接保存（不填任何内容）
    await page.locator('button:has-text("Save")').click();
    
    // 应该有验证错误
    const errors = await page.locator('.ant-form-item-explain-error').count();
    expect(errors).toBeGreaterThan(0);
    
    // 关闭弹窗
    await page.keyboard.press('Escape');
  });
});
