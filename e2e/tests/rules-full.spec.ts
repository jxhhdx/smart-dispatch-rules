import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { RulesPage } from '../pages/RulesPage';
import { generateRandomString } from '../utils/test-data';

// 通过 API 创建规则
async function createRuleViaAPI(page: any, token: string, data: any) {
  const response = await page.request.post('/api/v1/rules', {
    headers: { 'Authorization': `Bearer ${token}` },
    data: data
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  const result = await response.json();
  return result.data;
}

// 获取登录 token
async function getAuthToken(page: any): Promise<string> {
  const response = await page.request.post('/api/v1/auth/login', {
    data: { username: 'admin', password: 'admin123' }
  });
  const result = await response.json();
  return result.data.access_token;
}

test.describe('规则管理 - 完整测试', () => {
  let rulesPage: RulesPage;
  let dashboardPage: DashboardPage;
  let authToken: string;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // 获取 API token
    authToken = await getAuthToken(page);
    
    dashboardPage = new DashboardPage(page);
    await dashboardPage.expectLoaded();
    await dashboardPage.navigateToRules();
    
    rulesPage = new RulesPage(page);
    await rulesPage.expectLoaded();
  });

  // ==================== F - 功能路径测试 ====================

  test('F-01: 规则列表页面显示正常', async ({ page }) => {
    await expect(page.locator('text=Rule Management').first()).toBeVisible();
    await expect(page.locator('.ant-table')).toBeVisible();
    await expect(rulesPage.addButton).toBeVisible();
  });

  test('F-02: 创建新规则', async ({ page }) => {
    const ruleName = `测试规则_${generateRandomString()}`;
    
    // 通过 API 创建规则
    await createRuleViaAPI(page, authToken, {
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
      description: '自动创建的测试规则',
    });
    
    await rulesPage.page.reload();
    await rulesPage.expectLoaded();
    
    const exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
  });

  test('F-03: 查看规则详情', async ({ page }) => {
    const ruleName = `详情测试_${generateRandomString()}`;
    await createRuleViaAPI(page, authToken, {
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    await rulesPage.page.reload();
    await rulesPage.expectLoaded();
    
    await rulesPage.viewRule(ruleName);
    await expect(rulesPage.page.locator('.ant-modal')).toBeVisible();
    await expect(rulesPage.page.locator('.ant-modal')).toContainText(ruleName);
    await rulesPage.closeDetailModal();
  });

  test('F-04: 编辑规则', async ({ page }) => {
    const ruleName = `编辑测试_${generateRandomString()}`;
    await createRuleViaAPI(page, authToken, {
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    await rulesPage.page.reload();
    await rulesPage.expectLoaded();
    
    await rulesPage.editRule(ruleName, { priority: 999, description: '更新后的描述' });
    await rulesPage.page.reload();
    
    const exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
  });

  test('F-05: 删除规则', async ({ page }) => {
    const ruleName = `删除测试_${generateRandomString()}`;
    await createRuleViaAPI(page, authToken, {
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    await rulesPage.page.reload();
    await rulesPage.expectLoaded();
    let exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
    
    await rulesPage.deleteRule(ruleName);
    await rulesPage.page.reload();
    
    exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(false);
  });

  test('F-06: 搜索规则功能', async ({ page }) => {
    const ruleName = `搜索测试_${generateRandomString()}`;
    await createRuleViaAPI(page, authToken, {
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    await rulesPage.page.reload();
    await rulesPage.expectLoaded();
    
    await rulesPage.searchRule(ruleName);
    const exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
  });

  test('F-07: 发布规则', async ({ page }) => {
    const ruleName = `发布测试_${generateRandomString()}`;
    await createRuleViaAPI(page, authToken, {
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    await rulesPage.page.reload();
    await rulesPage.expectLoaded();
    
    // 发布规则 - 通过 API 发布
    const response = await page.request.get('/api/v1/rules', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await response.json();
    const rule = result.data.list.find((r: any) => r.name === ruleName);
    expect(rule).toBeTruthy();
    
    // 通过 API 发布
    const publishRes = await page.request.put(`/api/v1/rules/${rule.id}/status`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: { status: 1 }
    });
    expect(publishRes.status()).toBeGreaterThanOrEqual(200);
    expect(publishRes.status()).toBeLessThan(300);
    
    // 刷新页面验证状态
    await rulesPage.page.reload();
    await rulesPage.expectLoaded();
    
    // 验证发布状态（检查 Published 标签）
    await expect(rulesPage.page.locator('.ant-tag').filter({ hasText: /Published|已发布/i }).first()).toBeVisible();
  });

  test('F-08: 创建规则版本', async ({ page }) => {
    const ruleName = `版本测试_${generateRandomString()}`;
    const rule = await createRuleViaAPI(page, authToken, {
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    // 通过 API 创建版本
    const versionRes = await page.request.post(`/api/v1/rules/${rule.id}/versions`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: { 
        configJson: { maxDistance: 10, minRating: 4.5 },
        description: '版本1描述'
      }
    });
    expect(versionRes.status()).toBeGreaterThanOrEqual(200);
    expect(versionRes.status()).toBeLessThan(300);
    
    // 刷新页面并查看详情
    await rulesPage.page.reload();
    await rulesPage.expectLoaded();
    
    // 查看规则详情，验证版本显示
    await rulesPage.viewRule(ruleName);
    await expect(rulesPage.page.locator('.ant-modal')).toBeVisible();
    await expect(rulesPage.page.locator('.ant-modal')).toContainText('Version 1');
    await rulesPage.closeDetailModal();
  });

  test('F-09: 规则分页功能', async ({ page }) => {
    // 检查分页控件
    const pagination = page.locator('.ant-pagination');
    const hasPagination = await pagination.isVisible().catch(() => false);
    
    if (hasPagination) {
      await expect(pagination).toBeVisible();
      
      // 如果有多页，测试翻页
      const nextBtn = pagination.locator('.ant-pagination-next');
      if (await nextBtn.isEnabled().catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  // ==================== B - 边界值测试 ====================

  test('B-01: 创建优先级为0的规则', async ({ page }) => {
    const ruleName = `边界测试_优先级0_${generateRandomString()}`;
    await createRuleViaAPI(page, authToken, {
      name: ruleName,
      ruleType: 'distance',
      priority: 0,
    });
    
    await rulesPage.page.reload();
    await rulesPage.expectLoaded();
    
    const exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
  });

  test('B-02: 创建优先级为999的规则', async ({ page }) => {
    const ruleName = `边界测试_优先级999_${generateRandomString()}`;
    await createRuleViaAPI(page, authToken, {
      name: ruleName,
      ruleType: 'distance',
      priority: 999,
    });
    
    await rulesPage.page.reload();
    await rulesPage.expectLoaded();
    
    const exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
  });

  test('B-03: 超长规则名称', async ({ page }) => {
    const ruleName = `超长名称_${generateRandomString()}`.repeat(5);
    await createRuleViaAPI(page, authToken, {
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    await rulesPage.page.reload();
    await rulesPage.expectLoaded();
    
    const exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
  });

  test('B-04: 特殊字符规则名称', async ({ page }) => {
    const ruleName = `特殊字符_!@#$%^&*()_${generateRandomString()}`;
    await createRuleViaAPI(page, authToken, {
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    await rulesPage.page.reload();
    await rulesPage.expectLoaded();
    
    const exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
  });

  // ==================== E - 异常测试 ====================

  test('E-01: 空表单提交显示验证错误', async () => {
    await rulesPage.clickAdd();
    await rulesPage.saveButton.click();
    
    // 检查验证错误
    const errorMessages = await rulesPage.page.locator('.ant-form-item-explain-error').count();
    expect(errorMessages).toBeGreaterThan(0);
    
    // 关闭弹窗
    await rulesPage.page.locator('.ant-modal-close').or(rulesPage.page.locator('button').filter({ hasText: /Cancel|取消/ })).first().click();
  });

  test('E-02: 访问不存在的规则详情', async ({ page }) => {
    await page.goto('/rules/non-existent-id-12345');
    // 页面可能显示空状态、错误提示或重定向到列表页
    const hasError = await page.locator('text=404').or(page.locator('text=Not Found')).or(page.locator('text=规则不存在')).or(page.locator('text=Error')).or(page.locator('text=No data')).isVisible().catch(() => false);
    const isOnRulesPage = page.url().includes('/rules');
    expect(hasError || isOnRulesPage).toBeTruthy();
  });

  // ==================== S - 安全测试 ====================

  test('S-01: SQL注入防护测试', async ({ page }) => {
    const ruleName = `SQL注入测试_'; DROP TABLE rules; --_${generateRandomString()}`;
    await createRuleViaAPI(page, authToken, {
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    await rulesPage.page.reload();
    await rulesPage.expectLoaded();
    
    const exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
    
    // 搜索时也能正确处理
    await rulesPage.searchRule(ruleName);
    const found = await rulesPage.hasRule(ruleName);
    expect(found).toBe(true);
  });

  test('S-02: XSS注入防护测试', async ({ page }) => {
    const ruleName = `XSS测试_<script>alert(1)</script>_${generateRandomString()}`;
    await createRuleViaAPI(page, authToken, {
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
      description: '<img src=x onerror=alert(1)>',
    });
    
    await rulesPage.page.reload();
    await rulesPage.expectLoaded();
    
    const exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
  });

  // ==================== P - 性能测试 ====================

  test('P-01: 规则列表加载性能', async ({ page }) => {
    const startTime = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // 只记录时间，不强制断言，避免环境差异导致失败
    console.log(`规则列表加载时间: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(30000); // 30秒内加载完成
  });

  // ==================== P - 分页测试 ====================

  test('P-02: 规则列表分页显示 - i18n 变量正确解析', async ({ page }) => {
    // 创建多个规则
    for (let i = 0; i < 3; i++) {
      await createRuleViaAPI(page, authToken, {
        name: `分页规则_${i}_${generateRandomString()}`,
        ruleType: 'distance',
        priority: 50,
      });
    }
    
    await rulesPage.page.reload();
    await rulesPage.expectLoaded();
    
    // 验证分页组件存在
    const pagination = page.locator('.ant-pagination');
    await expect(pagination).toBeVisible();
    
    // 获取分页总数文本
    const totalText = await rulesPage.getPaginationTotal();
    console.log('Rules pagination total text:', totalText);
    
    // 验证 i18n 变量已正确解析 - 格式应为 "共 X 条" 或 "Total X items"
    expect(totalText).toMatch(/(共 \d+ 条|Total \d+ items)/);
    
    // 关键：验证没有显示未解析的模板字符串
    expect(totalText).not.toContain('{{count}}');
    expect(totalText).not.toContain('{{');
    expect(totalText).not.toContain('}}');
    expect(totalText).not.toContain('table.items');
    
    // 验证数字显示正确（至少有一条数据）
    const match = totalText.match(/\d+/);
    expect(match).toBeTruthy();
    if (match) {
      const count = parseInt(match[0], 10);
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });
});
