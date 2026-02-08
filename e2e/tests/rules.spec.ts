import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { RulesPage } from '../pages/RulesPage';
import { generateRandomString } from '../utils/test-data';

test.describe('规则管理功能测试', () => {
  let rulesPage: RulesPage;

  test.beforeEach(async ({ page }) => {
    // 登录并导航到规则管理
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    const dashboard = new DashboardPage(page);
    await dashboard.navigateToRules();
    
    rulesPage = new RulesPage(page);
    await rulesPage.expectLoaded();
  });

  test('✅ 创建新规则', async ({ page }) => {
    const ruleName = `Rule_${generateRandomString(6)}`;
    
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
      description: 'Test rule created by Playwright',
    });

    // 验证创建成功
    const hasRule = await rulesPage.hasRule(ruleName);
    expect(hasRule).toBe(true);
    
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('✅ 创建不同类型的规则', async () => {
    const ruleTypes = ['distance', 'workload', 'rating'];
    
    for (const type of ruleTypes) {
      const ruleName = `${type}_rule_${generateRandomString(4)}`;
      
      await rulesPage.createRule({
        name: ruleName,
        ruleType: type,
        priority: Math.floor(Math.random() * 100),
        description: `Test ${type} rule`,
      });

      const hasRule = await rulesPage.hasRule(ruleName);
      expect(hasRule).toBe(true);
    }
  });

  test('👁️ 查看规则详情', async ({ page }) => {
    // 创建一个规则
    const ruleName = `View_Test_${generateRandomString(6)}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 75,
    });

    // 查看详情
    await rulesPage.viewRule(ruleName);
    
    // 验证详情抽屉显示
    await expect(page.locator('.ant-drawer-title')).toContainText('Rule Detail');
    await expect(page.locator(`text=${ruleName}`)).toBeVisible();
    
    // 关闭抽屉
    await rulesPage.closeDetailDrawer();
  });

  test('🚀 发布规则', async ({ page }) => {
    // 创建规则
    const ruleName = `Publish_Test_${generateRandomString(6)}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 80,
    });

    // 发布规则
    await rulesPage.publishRule(ruleName);
    
    // 验证发布成功
    await expect(page.locator('.ant-message-success')).toBeVisible();
    
    // 验证状态变为已发布
    const row = page.locator('.ant-table-row').filter({
      has: page.locator(`text=${ruleName}`),
    });
    await expect(row.locator('text=Published')).toBeVisible();
  });

  test('✏️ 编辑规则', async ({ page }) => {
    // 创建规则
    const ruleName = `Edit_Test_${generateRandomString(6)}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });

    // 搜索并编辑
    await rulesPage.searchRule(ruleName);
    const row = page.locator('.ant-table-row').filter({
      has: page.locator(`text=${ruleName}`),
    });
    await row.locator('button:has-text("Edit")').click();

    // 修改优先级
    await page.locator('input#priority').fill('99');
    await rulesPage.saveRule();

    // 验证更新成功
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('🗑️ 删除规则', async ({ page }) => {
    // 创建要删除的规则
    const ruleName = `Delete_Test_${generateRandomString(6)}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 30,
    });

    // 删除
    await rulesPage.deleteRule(ruleName);
    
    // 验证删除成功
    await expect(page.locator('.ant-message-success')).toBeVisible();
    
    // 刷新确认删除
    await page.reload();
    const hasRule = await rulesPage.hasRule(ruleName);
    expect(hasRule).toBe(false);
  });

  test('🔍 按类型筛选规则', async ({ page }) => {
    // 选择规则类型筛选
    await page.locator('.ant-select').filter({ hasText: 'Rule Type' }).click();
    await page.locator('.ant-select-item:has-text("Distance")').click();
    
    // 等待筛选结果
    await page.waitForTimeout(500);
    
    // 验证表格只显示 Distance 类型的规则
    const rows = page.locator('.ant-table-row');
    const count = await rows.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const typeCell = rows.nth(i).locator('td').nth(2); // 假设第三列是类型
        await expect(typeCell).toContainText('distance');
      }
    }
  });

  test('📸 规则管理页面截图', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/rules-page.png',
      fullPage: true,
    });
  });
});
