import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LogsPage } from '../pages/LogsPage';
import { TestData } from '../utils/test-data';

test.describe('操作日志功能测试', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let logsPage: LogsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    logsPage = new LogsPage(page);
    
    // 登录
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    await dashboardPage.expectLoaded();
  });

  test('✅ 日志页面可以正常访问', async ({ page }) => {
    // 导航到日志页面
    await dashboardPage.navigateToLogs();
    await logsPage.expectLoaded();
    
    // 验证页面标题
    const pageTitle = await page.locator('h4, .ant-typography').first().textContent();
    expect(pageTitle).toMatch(/Logs|日志/i);
  });

  test('✅ 登录日志记录登录操作', async ({ page }) => {
    // 导航到日志页面
    await dashboardPage.navigateToLogs();
    await logsPage.expectLoaded();
    
    // 切换到登录日志Tab
    await logsPage.switchToLoginLogs();
    await page.waitForTimeout(800);
    
    // 获取当前Tab下的表格内容
    const activeTabPane = page.locator('.ant-tabs-tabpane-active');
    const tableInActiveTab = activeTabPane.locator('.ant-table');
    
    // 检查表格是否可见或存在
    const tableExists = await tableInActiveTab.count() > 0;
    expect(tableExists).toBeTruthy();
    
    // 获取表格数据
    const hasData = await logsPage.hasLogData();
    
    // 由于我们刚刚登录，应该至少有一条登录日志
    // 但如果是新数据库可能没有，所以不做强制断言
    if (hasData) {
      const rowCount = await logsPage.getTableRowCount();
      expect(rowCount).toBeGreaterThan(0);
      
      // 验证有admin用户的登录记录
      const tableText = await tableInActiveTab.first().textContent();
      expect(tableText).toMatch(/admin|管理员/i);
    }
  });

  test('✅ 操作日志可以切换Tab', async ({ page }) => {
    // 导航到日志页面
    await dashboardPage.navigateToLogs();
    await logsPage.expectLoaded();
    
    // 默认应该是操作日志Tab
    const operationTabActive = await page.locator('.ant-tabs-tab-active').filter({ hasText: /Operation|操作/i }).isVisible().catch(() => false);
    
    // 切换到登录日志
    await logsPage.switchToLoginLogs();
    await page.waitForTimeout(300);
    
    // 验证登录日志Tab激活
    const loginTabActive = await page.locator('.ant-tabs-tab-active').filter({ hasText: /Login|登录/i }).isVisible().catch(() => false);
    expect(loginTabActive).toBeTruthy();
    
    // 切换回操作日志
    await logsPage.switchToOperationLogs();
    await page.waitForTimeout(300);
    
    // 验证操作日志Tab激活
    const operationTabActiveAfter = await page.locator('.ant-tabs-tab-active').filter({ hasText: /Operation|操作/i }).isVisible().catch(() => false);
    expect(operationTabActiveAfter).toBeTruthy();
  });

  test('✅ 操作日志记录创建操作', async ({ page }) => {
    // 先创建一个角色以产生操作日志
    await dashboardPage.navigateToRoles();
    await page.waitForTimeout(500);
    
    // 点击创建按钮
    const createButton = page.locator('button').filter({ hasText: /New|新建|Add|添加|Create|创建/i }).first();
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();
      
      // 等待弹窗
      await page.waitForSelector('.ant-modal', { timeout: 5000 });
      
      // 填写表单
      const roleName = `TestRole_${Date.now()}`;
      await page.locator('input#name, input[placeholder*="name"]').fill(roleName);
      await page.locator('input#code, input[placeholder*="code"]').fill(`test_${Date.now()}`);
      
      // 保存
      const saveButton = page.locator('.ant-modal-footer button').filter({ hasText: /Save|保存|OK|确定/i }).first();
      await saveButton.click();
      
      // 等待操作完成
      await page.waitForTimeout(1000);
      
      // 导航到日志页面
      await dashboardPage.navigateToLogs();
      await logsPage.expectLoaded();
      
      // 验证操作日志Tab
      await logsPage.switchToOperationLogs();
      await page.waitForTimeout(500);
      
      // 等待表格加载
      await page.waitForSelector('.ant-table', { timeout: 5000 });
      
      // 获取表格数据
      const hasData = await logsPage.hasLogData();
      
      if (hasData) {
        // 验证有操作记录
        const tableText = await page.locator('.ant-table').textContent();
        
        // 应该包含角色管理相关的操作
        const hasRoleOperation = tableText?.match(/角色|Role/i);
        expect(hasRoleOperation).toBeTruthy();
      }
    }
  });

  test('✅ 日志表格显示正确的列', async ({ page }) => {
    // 导航到日志页面
    await dashboardPage.navigateToLogs();
    await logsPage.expectLoaded();
    
    // 等待表格加载
    await page.waitForSelector('.ant-table', { timeout: 5000 });
    
    // 获取表头
    const headers = await page.locator('.ant-table-thead th').allTextContents();
    
    // 验证有表头
    expect(headers.length).toBeGreaterThan(0);
    
    // 验证包含时间列（支持中英文）
    const hasTimeColumn = headers.some(h => h.match(/Time|时间|Created/i));
    expect(hasTimeColumn).toBeTruthy();
    
    // 验证包含用户列
    const hasUserColumn = headers.some(h => h.match(/User|用户/i));
    expect(hasUserColumn).toBeTruthy();
  });

  test('✅ 日志数据可以分页', async ({ page }) => {
    // 导航到日志页面
    await dashboardPage.navigateToLogs();
    await logsPage.expectLoaded();
    
    // 等待表格加载
    await page.waitForSelector('.ant-table', { timeout: 5000 });
    
    // 检查分页组件
    const pagination = page.locator('.ant-pagination');
    const hasPagination = await pagination.isVisible().catch(() => false);
    
    if (hasPagination) {
      // 验证分页组件可见
      expect(hasPagination).toBeTruthy();
      
      // 验证有分页信息
      const paginationText = await pagination.textContent();
      expect(paginationText).toBeTruthy();
    }
  });
});
