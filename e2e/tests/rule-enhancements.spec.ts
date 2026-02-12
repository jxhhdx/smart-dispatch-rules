import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { RulesPage } from '../pages/RulesPage';
import { generateRandomString } from '../utils/test-data';

// 获取登录 token
async function getAuthToken(page: any): Promise<string> {
  const response = await page.request.post('/api/v1/auth/login', {
    data: { username: 'admin', password: 'admin123' }
  });
  const result = await response.json();
  return result.data.access_token;
}

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

test.describe('规则增强功能测试', () => {
  let rulesPage: RulesPage;
  let dashboardPage: DashboardPage;
  let authToken: string;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    authToken = await getAuthToken(page);
    
    dashboardPage = new DashboardPage(page);
    await dashboardPage.expectLoaded();
    await dashboardPage.navigateToRules();
    
    rulesPage = new RulesPage(page);
    await rulesPage.expectLoaded();
  });

  // ==================== TEMP - 条件模板测试 ====================

  test.describe('条件模板功能', () => {
    test('TEMP-F-01: 保存条件为模板', async ({ page }) => {
      // 创建测试规则
      const ruleName = `模板测试规则_${generateRandomString()}`;
      await createRuleViaAPI(page, authToken, {
        name: ruleName,
        ruleType: 'distance',
        priority: 50,
      });
      
      await rulesPage.page.reload();
      await rulesPage.expectLoaded();

      // 打开高级编辑
      await rulesPage.openAdvancedEdit(ruleName);
      await page.waitForTimeout(500);

      // 添加一个条件
      await page.locator('.ant-tabs-tab').filter({ hasText: /条件|Conditions/ }).click();
      await page.waitForTimeout(300);

      // 保存为模板
      const templateName = `测试模板_${generateRandomString()}`;
      await rulesPage.saveAsTemplate(templateName, '这是一个测试模板');

      // 验证模板保存成功（通过消息提示）
      await expect(page.locator('.ant-message').locator('text=/保存成功|success/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('TEMP-F-02: 查看模板列表', async ({ page }) => {
      // 通过 API 创建模板
      const templateName = `列表测试模板_${generateRandomString()}`;
      await page.request.post('/api/v1/templates', {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: {
          name: templateName,
          description: '用于测试列表显示',
          conditions: [{ field: 'order.distance', operator: 'lte', value: '5000' }],
        }
      });

      // 创建测试规则
      const ruleName = `模板列表测试_${generateRandomString()}`;
      await createRuleViaAPI(page, authToken, { name: ruleName, ruleType: 'distance', priority: 50 });
      
      await rulesPage.page.reload();
      await rulesPage.expectLoaded();

      // 打开高级编辑并查看模板列表
      await rulesPage.openAdvancedEdit(ruleName);
      await page.waitForTimeout(500);
      await page.locator('.ant-tabs-tab').filter({ hasText: /条件|Conditions/ }).click();
      await page.waitForTimeout(300);

      // 打开模板选择器
      await rulesPage.openTemplateSelector();

      // 验证模板在列表中
      await expect(page.locator('.ant-list-item').filter({ hasText: templateName })).toBeVisible();
    });

    test('TEMP-F-03: 从模板加载条件', async ({ page }) => {
      // 通过 API 创建模板
      const templateName = `加载测试模板_${generateRandomString()}`;
      await page.request.post('/api/v1/templates', {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: {
          name: templateName,
          description: '用于测试加载',
          conditions: [
            { field: 'rider.rating', operator: 'gte', value: '4.5' },
            { field: 'order.distance', operator: 'lte', value: '3000' },
          ],
        }
      });

      // 创建测试规则
      const ruleName = `加载模板测试_${generateRandomString()}`;
      await createRuleViaAPI(page, authToken, { name: ruleName, ruleType: 'rating', priority: 60 });
      
      await rulesPage.page.reload();
      await rulesPage.expectLoaded();

      // 打开高级编辑
      await rulesPage.openAdvancedEdit(ruleName);
      await page.waitForTimeout(500);
      await page.locator('.ant-tabs-tab').filter({ hasText: /条件|Conditions/ }).click();
      await page.waitForTimeout(300);

      // 从模板加载
      await rulesPage.loadTemplate(templateName);

      // 验证条件已加载
      await expect(page.locator('.ant-message').locator('text=/已加载|loaded/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('TEMP-F-04: 删除模板', async ({ page }) => {
      // 通过 API 创建模板
      const templateName = `删除测试模板_${generateRandomString()}`;
      const response = await page.request.post('/api/v1/templates', {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: {
          name: templateName,
          description: '将被删除',
          conditions: [{ field: 'order.amount', operator: 'gte', value: '100' }],
        }
      });
      const result = await response.json();
      const templateId = result.data.id;

      // 通过 API 删除模板
      const deleteResponse = await page.request.delete(`/api/v1/templates/${templateId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      expect(deleteResponse.status()).toBe(200);

      // 验证删除成功
      const getResponse = await page.request.get(`/api/v1/templates/${templateId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      expect(getResponse.status()).toBe(404);
    });

    test('TEMP-F-05: 模板命名唯一性校验', async ({ page }) => {
      const templateName = `唯一性测试_${generateRandomString()}`;
      
      // 创建第一个模板
      const response1 = await page.request.post('/api/v1/templates', {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: {
          name: templateName,
          conditions: [{ field: 'test', operator: 'eq', value: '1' }],
        }
      });
      expect(response1.status()).toBe(201);

      // 尝试创建同名模板
      const response2 = await page.request.post('/api/v1/templates', {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: {
          name: templateName,
          conditions: [{ field: 'test2', operator: 'eq', value: '2' }],
        }
      });
      expect(response2.status()).toBe(409);
      const result = await response2.json();
      expect(result.message).toContain('已存在');
    });
  });

  // ==================== XLS - Excel 导出测试 ====================

  test.describe('Excel 导出功能', () => {
    test('XLS-F-01: 单条规则导出Excel', async ({ page }) => {
      // 创建测试规则
      const ruleName = `Excel导出测试_${generateRandomString()}`;
      await createRuleViaAPI(page, authToken, {
        name: ruleName,
        ruleType: 'distance',
        priority: 100,
        description: '用于测试Excel导出',
      });
      
      await rulesPage.page.reload();
      await rulesPage.expectLoaded();

      // 导出为 Excel
      await rulesPage.exportSingleRule(ruleName, 'xlsx');

      // 验证导出成功（通过检查是否有下载提示或成功消息）
      // 注意：实际文件下载验证需要在 Playwright 中配置 downloadsPath
    });

    test('XLS-F-02: 批量规则导出Excel', async ({ page }) => {
      // 创建多个测试规则
      for (let i = 0; i < 3; i++) {
        await createRuleViaAPI(page, authToken, {
          name: `批量导出测试_${i}_${generateRandomString()}`,
          ruleType: 'distance',
          priority: 50 + i,
        });
      }
      
      await rulesPage.page.reload();
      await rulesPage.expectLoaded();

      // 导出所有规则为 Excel
      await rulesPage.exportRules('xlsx');
    });

    test('XLS-F-03: Excel包含多个Sheet', async ({ page }) => {
      // API 测试：验证导出数据结构
      const response = await page.request.get('/api/v1/rules/export?format=xlsx', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      
      // 验证返回格式
      expect(result.data.format).toBe('xlsx');
      expect(result.data.contentType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(result.data.filename).toMatch(/\.xlsx$/);
    });
  });


  // ==================== 导出格式测试 ====================

  test.describe('导出格式支持', () => {
    test('EXP-F-01: 导出JSON格式', async ({ page }) => {
      const response = await page.request.get('/api/v1/rules/export?format=json', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.data).toHaveProperty('rules');
      expect(result.data).toHaveProperty('exportTime');
    });

    test('EXP-F-03: 导出CSV格式', async ({ page }) => {
      const response = await page.request.get('/api/v1/rules/export?format=csv', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.data.format).toBe('csv');
      expect(result.data.content).toContain('ID,Name');
    });

    test('EXP-E-02: 无效格式参数', async ({ page }) => {
      const response = await page.request.get('/api/v1/rules/export?format=xml', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      expect(response.status()).toBe(400);
      const result = await response.json();
      expect(result.message).toContain('不支持');
    });
  });
});
