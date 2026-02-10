import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LanguagePage } from '../pages/LanguagePage';

test.describe('Dashboard 页面测试', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    // 先登录
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    dashboardPage = new DashboardPage(page);
    await dashboardPage.expectLoaded();
  });

  test('📊 Dashboard 页面显示统计卡片', async ({ page }) => {
    // 检查统计卡片数量
    const statCards = await page.locator('.ant-card').count();
    expect(statCards).toBeGreaterThanOrEqual(4);
    
    // 检查具体的统计项
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Total Rules')).toBeVisible();
    await expect(page.locator('text=Published Rules')).toBeVisible();
  });

  test('🧭 左侧菜单导航正常', async ({ page }) => {
    // 测试 Users 菜单
    await dashboardPage.navigateToUsers();
    await expect(page.locator('text=User Management').first()).toBeVisible();
    
    // 返回 Dashboard
    await dashboardPage.clickMenu('dashboard');
    await dashboardPage.expectLoaded();
    
    // 测试 Rules 菜单
    await dashboardPage.navigateToRules();
    await expect(page.locator('text=Rules').first()).toBeVisible();
  });

  test('🌐 语言切换功能', async () => {
    const languagePage = new LanguagePage(dashboardPage.page);
    
    // 切换到中文并验证
    await languagePage.switchToChinese();
    await languagePage.expectChineseMenu();
    await expect(languagePage.page.locator('h4')).toContainText('仪表盘');
    
    // 切换回英文
    await languagePage.switchToEnglish();
    await languagePage.expectEnglishMenu();
  });

  test('📱 响应式布局 - 侧边栏折叠', async ({ page }) => {
    // 点击折叠按钮
    const collapseButton = page.locator('.ant-layout-sider-trigger');
    if (await collapseButton.isVisible().catch(() => false)) {
      await collapseButton.click();
      
      // 验证侧边栏折叠
      await expect(page.locator('.ant-layout-sider-collapsed')).toBeVisible();
    }
  });

  test('👤 用户菜单和下拉功能', async ({ page }) => {
    // 点击用户头像/菜单
    await dashboardPage.userMenu.click();
    
    // 检查下拉菜单中有 Logout 选项（实际 UI 只有 Logout）
    await expect(page.getByRole('menuitem').filter({ hasText: /Logout/ })).toBeVisible();
  });

  test('🚪 登出功能正常', async ({ page }) => {
    await dashboardPage.logout();
    
    // 验证回到登录页
    const loginPage = new LoginPage(page);
    await expect(page).toHaveURL(/.*login/);
  });

  test('📸 Dashboard 页面截图', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/dashboard.png',
      fullPage: true,
    });
  });
});
