import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { generateRandomString, generateRandomEmail } from '../utils/test-data';

test.describe('关键功能完整测试', () => {
  test('完整业务流程: 登录->创建规则->创建用户->查看日志', async ({ page }) => {
    // 1. 登录
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // 2. 创建规则
    await page.goto('/rules');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    await expect(page.locator('text=Rule Management').first()).toBeVisible();
    
    const ruleName = `规则_${generateRandomString()}`;
    await page.locator('button').filter({ hasText: /Create|创建/ }).first().click();
    await page.locator('input[placeholder*="rule name"]').fill(ruleName);
    await page.locator('.ant-form-item').filter({ hasText: /Rule Type|类型/ }).locator('.ant-select').first().click();
    await page.locator('.ant-select-item').filter({ hasText: /distance/i }).first().click();
    await page.locator('button').filter({ hasText: /Save|保存/ }).first().click();
    await page.waitForTimeout(1000);
    
    // 3. 创建用户
    await page.goto('/users');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    await expect(page.locator('text=User Management').first()).toBeVisible();
    
    const username = `用户_${generateRandomString()}`;
    await page.locator('button').filter({ hasText: /Create|创建/ }).first().click();
    await page.locator('input[placeholder*="username"]').fill(username);
    await page.locator('input[placeholder*="email"]').fill(generateRandomEmail());
    await page.locator('input[placeholder*="password"]').fill('Test123!');
    await page.locator('button').filter({ hasText: /Save|保存/ }).first().click();
    await page.waitForTimeout(1000);
    
    // 4. 查看日志
    await page.goto('/logs');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    await expect(page.locator('text=System Logs').first()).toBeVisible();
    
    // 5. 验证数据存在
    await page.goto('/rules');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    const ruleExists = await page.locator('td').filter({ hasText: ruleName }).isVisible().catch(() => false);
    expect(ruleExists).toBe(true);
    
    await page.goto('/users');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    const userExists = await page.locator('td').filter({ hasText: username }).isVisible().catch(() => false);
    expect(userExists).toBe(true);
  });

  test('登录验证', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // 错误密码
    await loginPage.login('admin', 'wrong');
    await expect(page).toHaveURL(/.*login/);
    
    // 正确密码
    await loginPage.loginAsAdmin();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('未认证访问拦截', async ({ page }) => {
    await page.goto('/users');
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });
});
