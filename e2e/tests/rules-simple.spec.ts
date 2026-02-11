import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { RulesPage } from '../pages/RulesPage';
import { generateRandomString } from '../utils/test-data';

test.describe('规则管理测试', () => {
  let rulesPage: RulesPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    const dashboard = new DashboardPage(page);
    await dashboard.navigateToRules();
    
    rulesPage = new RulesPage(page);
  });

  test('规则列表页面显示正常', async ({ page }) => {
    await expect(page.locator('text=Rule Management').first()).toBeVisible();
    await expect(page.locator('.ant-table')).toBeVisible();
  });

  test('创建新规则', async () => {
    const ruleName = `测试规则_${generateRandomString()}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
      description: '自动创建的测试规则',
    });
    
    await rulesPage.page.reload();
    const exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(true);
  });

  test('查看规则详情', async () => {
    const ruleName = `详情测试_${generateRandomString()}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    await rulesPage.viewRule(ruleName);
    await expect(rulesPage.page.locator('.ant-modal')).toBeVisible();
  });

  test('删除规则', async () => {
    const ruleName = `删除测试_${generateRandomString()}`;
    await rulesPage.createRule({
      name: ruleName,
      ruleType: 'distance',
      priority: 50,
    });
    
    await rulesPage.page.reload();
    await rulesPage.deleteRule(ruleName);
    
    await rulesPage.page.reload();
    const exists = await rulesPage.hasRule(ruleName);
    expect(exists).toBe(false);
  });
});
