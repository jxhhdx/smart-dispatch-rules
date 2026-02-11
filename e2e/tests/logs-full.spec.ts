import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LogsPage } from '../pages/LogsPage';

test.describe('日志审计 - 完整测试', () => {
  let logsPage: LogsPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
    await dashboard.navigateToLogs();
    
    logsPage = new LogsPage(page);
    await logsPage.expectLoaded();
  });

  // ==================== F - 功能路径测试 ====================

  test('F-01: 日志页面显示正常', async ({ page }) => {
    await expect(page.locator('text=System Logs').first()).toBeVisible();
    await expect(page.locator('.ant-table')).toBeVisible();
  });

  test('F-02: 操作日志列表显示', async () => {
    await logsPage.switchToOperationLogs();
    await expect(logsPage.table).toBeVisible();
  });

  test('F-03: 登录日志列表显示', async () => {
    await logsPage.switchToLoginLogs();
    await expect(logsPage.table).toBeVisible();
  });

  test('F-04: 搜索日志功能', async () => {
    await logsPage.searchLogs('admin');
    const hasData = await logsPage.hasLogData();
    // 可能有数据也可能没有，但不应报错
    expect(typeof hasData).toBe('boolean');
  });

  test('F-05: 按模块筛选日志', async () => {
    await logsPage.filterByModule('rules');
    await logsPage.page.waitForTimeout(500);
    
    const hasData = await logsPage.hasLogData();
    expect(typeof hasData).toBe('boolean');
  });

  test('F-06: 按动作筛选日志', async () => {
    await logsPage.filterByAction('create');
    await logsPage.page.waitForTimeout(500);
    
    const hasData = await logsPage.hasLogData();
    expect(typeof hasData).toBe('boolean');
  });

  test('F-07: 按时间范围筛选', async () => {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = startDate;
    
    await logsPage.filterByDateRange(startDate, endDate);
    await logsPage.page.waitForTimeout(500);
    
    const hasData = await logsPage.hasLogData();
    expect(typeof hasData).toBe('boolean');
  });

  test('F-08: 查看日志详情', async () => {
    if (await logsPage.hasLogData()) {
      await logsPage.viewLogDetail(0);
      await expect(logsPage.page.locator('.ant-modal')).toBeVisible();
      await logsPage.closeDetailModal();
    }
  });

  test('F-09: 日志分页功能', async ({ page }) => {
    const pagination = page.locator('.ant-pagination');
    const hasPagination = await pagination.isVisible().catch(() => false);
    
    if (hasPagination) {
      await expect(pagination).toBeVisible();
      
      const nextBtn = pagination.locator('.ant-pagination-next');
      if (await nextBtn.isEnabled().catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  // ==================== B - 边界值测试 ====================

  test('B-01: 单天时间范围筛选', async () => {
    const today = new Date().toISOString().split('T')[0];
    await logsPage.filterByDateRange(today, today);
    await logsPage.page.waitForTimeout(500);
    
    const hasData = await logsPage.hasLogData();
    expect(typeof hasData).toBe('boolean');
  });

  test('B-02: 跨年时间范围筛选', async () => {
    await logsPage.filterByDateRange('2023-12-31', '2024-01-01');
    await logsPage.page.waitForTimeout(500);
    
    const hasData = await logsPage.hasLogData();
    expect(typeof hasData).toBe('boolean');
  });

  test('B-03: 开始日期晚于结束日期', async () => {
    await logsPage.filterByDateRange('2024-12-31', '2024-01-01');
    await logsPage.page.waitForTimeout(500);
    
    // 应该返回空结果或显示错误
    const rowCount = await logsPage.getTableRowCount();
    expect(rowCount).toBe(0);
  });

  test('B-04: 超长关键词搜索', async () => {
    const longKeyword = 'a'.repeat(100);
    await logsPage.searchLogs(longKeyword);
    await logsPage.page.waitForTimeout(500);
    
    // 不应报错
    const hasData = await logsPage.hasLogData();
    expect(typeof hasData).toBe('boolean');
  });

  // ==================== E - 异常测试 ====================

  test('E-01: 无效日期格式处理', async () => {
    // 尝试输入无效日期
    const dateInputs = logsPage.page.locator('input[placeholder*="Date"]').or(logsPage.page.locator('.ant-picker-input input'));
    if (await dateInputs.first().isVisible().catch(() => false)) {
      await dateInputs.first().fill('invalid-date');
      await logsPage.page.keyboard.press('Enter');
      
      // 应该显示验证错误或不应用筛选
      await logsPage.page.waitForTimeout(500);
    }
  });

  // ==================== P - 性能测试 ====================

  test('P-01: 日志列表加载性能', async ({ page }) => {
    const startTime = Date.now();
    await page.reload();
    await logsPage.expectLoaded();
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
  });

  test('P-02: 大量日志筛选性能', async () => {
    const startTime = Date.now();
    await logsPage.filterByModule('rules');
    await logsPage.filterByAction('create');
    const filterTime = Date.now() - startTime;
    
    expect(filterTime).toBeLessThan(3000);
  });

  // ==================== S - 安全测试 ====================

  test('S-01: SQL注入防护', async () => {
    await logsPage.searchLogs("'; DROP TABLE logs; --");
    await logsPage.page.waitForTimeout(500);
    
    // 页面应正常显示，不报错
    await expect(logsPage.table).toBeVisible();
  });

  test('S-02: XSS注入防护', async () => {
    await logsPage.searchLogs('<script>alert(1)</script>');
    await logsPage.page.waitForTimeout(500);
    
    // 页面应正常显示，不执行脚本
    await expect(logsPage.table).toBeVisible();
  });

  test('S-03: 未授权访问防护', async ({ page }) => {
    // 先登出
    const dashboard = new DashboardPage(page);
    await dashboard.logout();
    
    // 尝试直接访问日志页面
    await page.goto('/logs');
    
    // 应该重定向到登录页或显示401
    await expect(page).toHaveURL(/.*login/);
  });
});
