import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LanguagePage } from '../pages/LanguagePage';

test.describe('国际化 (i18n) 测试', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let languagePage: LanguagePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    languagePage = new LanguagePage(page);
    
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    await dashboardPage.expectLoaded();
  });

  test('🌐 语言切换器应该可见', async () => {
    // 验证语言切换按钮存在
    await expect(languagePage.languageDropdown).toBeVisible();
    
    // 点击应该展开下拉菜单
    await languagePage.openLanguageMenu();
    
    // 验证所有语言选项都存在
    await expect(languagePage.page.locator('.ant-dropdown-menu-item').filter({ hasText: /简体中文|🇨🇳/ })).toBeVisible();
    await expect(languagePage.page.locator('.ant-dropdown-menu-item').filter({ hasText: /English|🇺🇸/ })).toBeVisible();
    await expect(languagePage.page.locator('.ant-dropdown-menu-item').filter({ hasText: /日本語|🇯🇵/ })).toBeVisible();
    await expect(languagePage.page.locator('.ant-dropdown-menu-item').filter({ hasText: /한국어|🇰🇷/ })).toBeVisible();
  });

  test('🇨🇳 切换到中文后菜单显示中文', async () => {
    // 切换到中文
    await languagePage.switchToChinese();
    
    // 验证菜单已更新为中文
    await languagePage.expectChineseMenu();
    
    // 验证 Dashboard 标题
    await expect(languagePage.page.locator('h4')).toContainText('仪表盘');
  });

  test('🇺🇸 切换到英文后菜单显示英文', async () => {
    // 切换到英文
    await languagePage.switchToEnglish();
    
    // 验证菜单已更新为英文
    await languagePage.expectEnglishMenu();
    
    // 验证 Dashboard 标题
    await expect(languagePage.page.locator('h4')).toContainText(/Dashboard/i);
  });

  test('🔄 多次切换语言应该正常工作', async () => {
    // 切换到英文
    await languagePage.switchToEnglish();
    await languagePage.expectEnglishMenu();
    
    // 切换到中文
    await languagePage.switchToChinese();
    await languagePage.expectChineseMenu();
    
    // 再次切换到英文
    await languagePage.switchToEnglish();
    await languagePage.expectEnglishMenu();
  });

  test('💾 语言设置应该在页面刷新后保持', async ({ page }) => {
    // 切换到中文
    await languagePage.switchToChinese();
    await languagePage.expectChineseMenu();
    
    // 刷新页面
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 验证语言设置仍然有效
    await languagePage.expectChineseMenu();
  });

  test('🌍 登录页面也应该支持语言切换', async ({ page }) => {
    // 先登出
    await dashboardPage.logout();
    
    // 在登录页面切换语言
    const loginLangPage = new LanguagePage(page);
    await loginLangPage.switchToEnglish();
    
    // 验证登录页面文本已切换
    await expect(page.locator('h2')).toContainText(/Login|Sign In/i);
  });

  test('📊 统计卡片在不同语言下显示正常', async () => {
    // 切换到中文
    await languagePage.switchToChinese();
    
    // 验证统计卡片显示中文
    await expect(languagePage.page.locator('.ant-card')).toContainText('总用户数');
    await expect(languagePage.page.locator('.ant-card')).toContainText('总规则数');
    
    // 切换到英文
    await languagePage.switchToEnglish();
    
    // 验证统计卡片显示英文
    await expect(languagePage.page.locator('.ant-card')).toContainText('Total Users');
    await expect(languagePage.page.locator('.ant-card')).toContainText('Total Rules');
  });

  test('👤 用户管理页面国际化', async ({ page }) => {
    // 切换到中文
    await languagePage.switchToChinese();
    
    // 进入用户管理
    await dashboardPage.navigateToUsers();
    
    // 验证页面显示中文
    await expect(page.locator('h4')).toContainText('用户管理');
    
    // 切换到英文
    await languagePage.switchToEnglish();
    
    // 验证页面显示英文
    await expect(page.locator('h4')).toContainText(/Users/i);
  });

  test('📝 表单验证错误消息应该正确翻译', async ({ page }) => {
    // 切换到中文
    await languagePage.switchToChinese();
    
    // 进入用户管理
    await dashboardPage.navigateToUsers();
    
    // 点击添加按钮
    await page.locator('button').filter({ hasText: /新增|Create/ }).first().click();
    
    // 直接点击保存（不填内容）
    await page.locator('button').filter({ hasText: /保存|Save/ }).first().click();
    
    // 验证错误消息显示中文
    const errorMessages = await page.locator('.ant-form-item-explain-error').allTextContents();
    expect(errorMessages.some(msg => msg.includes('请输入') || msg.includes('必填'))).toBe(true);
  });

  test('🎌 切换到日文应该正确显示', async () => {
    // 切换到日文
    await languagePage.switchToJapanese();
    
    // 验证菜单显示日文
    await expect(languagePage.page.locator('.ant-menu')).toContainText(/ダッシュボード/);
  });

  test('🇰🇷 切换到韩文应该正确显示', async () => {
    // 切换到韩文
    await languagePage.switchToKorean();
    
    // 验证菜单显示韩文
    await expect(languagePage.page.locator('.ant-menu')).toContainText(/대시보드/);
  });

  test('🌐 语言切换后 API 请求应该携带正确的语言头', async ({ page }) => {
    // 监听 API 请求
    const apiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        const headers = request.headers();
        if (headers['x-locale'] || headers['accept-language']) {
          apiRequests.push(headers['x-locale'] || headers['accept-language']);
        }
      }
    });
    
    // 切换到中文
    await languagePage.switchToChinese();
    
    // 触发一个 API 请求
    await dashboardPage.navigateToUsers();
    
    // 验证请求头包含语言设置
    expect(apiRequests.some(lang => lang.includes('zh'))).toBe(true);
  });
});
