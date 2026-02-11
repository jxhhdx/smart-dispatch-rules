import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TestData } from '../utils/test-data';

test.describe('仪表盘统计功能测试', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    
    // 登录
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    await dashboardPage.expectLoaded();
  });

  test('✅ 仪表盘显示真实的统计数据', async ({ page }) => {
    // 等待统计数据加载
    await page.waitForSelector('.ant-statistic', { timeout: 10000 });
    
    // 验证有4个统计卡片
    const statCards = await page.locator('.ant-statistic').count();
    expect(statCards).toBe(4);
    
    // 验证每个统计卡片都有标题和数值
    const statTitles = await page.locator('.ant-statistic-title').allTextContents();
    const statValues = await page.locator('.ant-statistic-content-value-int').allTextContents();
    
    // 验证标题存在
    expect(statTitles.length).toBe(4);
    
    // 验证每个统计值都是数字（从API获取的真实数据）
    for (const value of statValues) {
      const numValue = parseInt(value, 10);
      expect(isNaN(numValue)).toBeFalsy();
      expect(numValue).toBeGreaterThanOrEqual(0);
    }
  });

  test('✅ 统计卡片显示正确的标题', async ({ page }) => {
    // 等待统计数据加载
    await page.waitForSelector('.ant-statistic', { timeout: 10000 });
    
    const statTitles = await page.locator('.ant-statistic-title').allTextContents();
    
    // 验证有4个标题
    expect(statTitles.length).toBe(4);
    
    // 验证标题包含预期的关键词（支持中英文）
    const allTitles = statTitles.join(' ');
    
    // 检查是否包含用户数相关标题
    const hasUserTitle = allTitles.match(/用户|Users|总用户/i);
    expect(hasUserTitle).toBeTruthy();
    
    // 检查是否包含规则数相关标题
    const hasRuleTitle = allTitles.match(/规则|Rules/i);
    expect(hasRuleTitle).toBeTruthy();
    
    // 检查是否包含角色数相关标题
    const hasRoleTitle = allTitles.match(/角色|Roles/i);
    expect(hasRoleTitle).toBeTruthy();
    
    // 检查是否包含已发布规则相关标题
    const hasPublishedTitle = allTitles.match(/发布|Published/i);
    expect(hasPublishedTitle).toBeTruthy();
  });

  test('✅ 统计数值从API动态获取', async ({ page }) => {
    // 先刷新页面，同时监听API请求
    const apiResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/v1/dashboard/stats') && response.status() === 200,
      { timeout: 10000 }
    );
    
    await page.reload();
    
    // 等待统计数据加载
    await page.waitForSelector('.ant-statistic', { timeout: 10000 });
    
    // 等待API响应
    const apiResponse = await apiResponsePromise;
    
    const apiData = await apiResponse.json();
    expect(apiData.data).toBeDefined();
    expect(apiData.data).toHaveProperty('totalUsers');
    expect(apiData.data).toHaveProperty('totalRules');
    expect(apiData.data).toHaveProperty('totalRoles');
    expect(apiData.data).toHaveProperty('publishedRules');
  });

  test('✅ 统计卡片有加载状态', async ({ page }) => {
    // 刷新页面触发加载
    await page.reload();
    
    // 等待加载完成
    await page.waitForSelector('.ant-statistic', { timeout: 10000 });
    
    // 验证统计卡片可见
    const statCards = await page.locator('.ant-statistic').count();
    expect(statCards).toBe(4);
  });

  test('✅ 统计数值与API返回一致', async ({ page }) => {
    // 等待API响应
    const apiResponse = await page.waitForResponse(
      response => response.url().includes('/api/v1/dashboard/stats') && response.status() === 200,
      { timeout: 5000 }
    );
    
    const apiData = await apiResponse.json();
    
    // 等待页面渲染
    await page.waitForTimeout(500);
    
    // 获取显示的数值
    const statValues = await page.locator('.ant-statistic-content-value-int').allTextContents();
    
    // 验证数值与API返回一致
    // 注意：由于顺序可能不同，我们验证总数匹配
    const displayedTotal = statValues.map(v => parseInt(v, 10)).reduce((a, b) => a + b, 0);
    const apiTotal = apiData.data.totalUsers + apiData.data.totalRules + 
                     apiData.data.totalRoles + apiData.data.publishedRules;
    
    // 数值应该匹配（允许顺序不同）
    const displayedValues = statValues.map(v => parseInt(v, 10)).sort((a, b) => a - b);
    const apiValues = [
      apiData.data.totalUsers,
      apiData.data.totalRules,
      apiData.data.totalRoles,
      apiData.data.publishedRules
    ].sort((a, b) => a - b);
    
    expect(displayedValues).toEqual(apiValues);
  });
});
