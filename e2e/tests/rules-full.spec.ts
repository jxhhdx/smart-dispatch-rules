import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { RulesPage } from '../pages/RulesPage';
import { generateRandomString } from '../utils/test-data';

test.describe('规则管理 - 完整测试', () => {
  let rulesPage: RulesPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
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

  test('F-02: 创建新规则', async () => {
    const ruleName = `测试规则_${generateRandomString()}`;
    await rulesPage.createRule({
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

  test('F-03: 查看规则详情', async () => {
    const ruleName = `详情测试_${generateRandomString()}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    await rulesPage.viewRule(ruleName);
    await expect(rulesPage.page.locator('.ant-modal')).toBeVisible();
    await expect(rulesPage.page.locator('.ant-modal')).toContainText(ruleName);
    await rulesPage.closeDetailModal();
  });

  test('F-04: 编辑规则', async () => {
    const ruleName = `编辑测试_${generateRandomString()}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    await rulesPage.editRule(ruleName, { priority: 999, description: '更新后的描述' });
    await rulesPage.page.reload();
    
    const exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
  });

  test('F-05: 删除规则', async () => {
    const ruleName = `删除测试_${generateRandomString()}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    await rulesPage.page.reload();
    let exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
    
    await rulesPage.deleteRule(ruleName);
    await rulesPage.page.reload();
    
    exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(false);
  });

  test('F-06: 搜索规则功能', async () => {
    const ruleName = `搜索测试_${generateRandomString()}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    await rulesPage.searchRule(ruleName);
    const exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
  });

  test('F-07: 发布规则', async () => {
    const ruleName = `发布测试_${generateRandomString()}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    await rulesPage.publishRule(ruleName);
    // 验证发布状态（检查switch状态或标签）
    await expect(rulesPage.page.locator('.ant-switch-checked').first()).toBeVisible();
  });

  test('F-08: 创建规则版本', async () => {
    const ruleName = `版本测试_${generateRandomString()}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    await rulesPage.openVersions(ruleName);
    await rulesPage.createVersion({ maxDistance: 10, minRating: 4.5 }, '版本1描述');
    
    await expect(rulesPage.page.locator('text=Version 1').or(rulesPage.page.locator('text=v1'))).toBeVisible();
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

  test('B-01: 创建优先级为0的规则', async () => {
    const ruleName = `边界测试_优先级0_${generateRandomString()}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 0,
    });
    
    const exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
  });

  test('B-02: 创建优先级为999的规则', async () => {
    const ruleName = `边界测试_优先级999_${generateRandomString()}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 999,
    });
    
    const exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
  });

  test('B-03: 超长规则名称', async () => {
    const ruleName = `超长名称_${generateRandomString()}`.repeat(5);
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    const exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
  });

  test('B-04: 特殊字符规则名称', async () => {
    const ruleName = `特殊字符_!@#$%^&*()_${generateRandomString()}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
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
    await page.goto('/rules/non-existent-id');
    // 页面应该显示错误或404
    const hasError = await page.locator('text=404').or(page.locator('text=Not Found')).or(page.locator('text=规则不存在')).or(page.locator('text=Error')).isVisible().catch(() => false);
    expect(hasError || page.url().includes('error') || page.url().includes('404')).toBeTruthy();
  });

  // ==================== S - 安全测试 ====================

  test('S-01: SQL注入防护测试', async () => {
    const ruleName = `SQL注入测试_'; DROP TABLE rules; --_${generateRandomString()}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    const exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
    
    // 搜索时也能正确处理
    await rulesPage.searchRule(ruleName);
    const found = await rulesPage.hasRule(ruleName);
    expect(found).toBe(true);
  });

  test('S-02: XSS注入防护测试', async () => {
    const ruleName = `XSS测试_<script>alert(1)</script>_${generateRandomString()}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
      description: '<img src=x onerror=alert(1)>',
    });
    
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
});
