import { test, expect } from '@playwright/test';

test.describe('最终验收测试', () => {
  test('1. 登录系统', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Username|用户名/).fill('admin');
    await page.getByPlaceholder(/Password|密码/).fill('admin123');
    await page.getByRole('button', { name: /Login|登录/ }).click();
    
    // 验证登录成功（URL变为/dashboard或/）
    await page.waitForURL(/\/dashboard|\/$/, { timeout: 10000 });
    console.log('✅ 登录测试通过');
  });

  test('2. 规则管理页面', async ({ page }) => {
    // 先登录
    await page.goto('/');
    await page.getByPlaceholder(/Username|用户名/).fill('admin');
    await page.getByPlaceholder(/Password|密码/).fill('admin123');
    await page.getByRole('button', { name: /Login|登录/ }).click();
    await page.waitForURL(/\/dashboard|\/$/, { timeout: 10000 });
    
    // 访问规则页面
    await page.goto('/rules');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    
    const title = await page.locator('h4').textContent();
    console.log('规则页面标题:', title);
    console.log('✅ 规则管理页面测试通过');
  });

  test('3. 用户管理页面', async ({ page }) => {
    // 先登录
    await page.goto('/');
    await page.getByPlaceholder(/Username|用户名/).fill('admin');
    await page.getByPlaceholder(/Password|密码/).fill('admin123');
    await page.getByRole('button', { name: /Login|登录/ }).click();
    await page.waitForURL(/\/dashboard|\/$/, { timeout: 10000 });
    
    // 访问用户页面
    await page.goto('/users');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    console.log('✅ 用户管理页面测试通过');
  });

  test('4. 角色管理页面', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Username|用户名/).fill('admin');
    await page.getByPlaceholder(/Password|密码/).fill('admin123');
    await page.getByRole('button', { name: /Login|登录/ }).click();
    await page.waitForURL(/\/dashboard|\/$/, { timeout: 10000 });
    
    await page.goto('/roles');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    console.log('✅ 角色管理页面测试通过');
  });

  test('5. 日志审计页面', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Username|用户名/).fill('admin');
    await page.getByPlaceholder(/Password|密码/).fill('admin123');
    await page.getByRole('button', { name: /Login|登录/ }).click();
    await page.waitForURL(/\/dashboard|\/$/, { timeout: 10000 });
    
    await page.goto('/logs');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    console.log('✅ 日志审计页面测试通过');
  });

  test('6. 未认证拦截', async ({ page }) => {
    await page.goto('/users');
    // 应该被重定向到登录页
    await page.waitForURL(/\/login|\/$/, { timeout: 10000 });
    console.log('✅ 未认证拦截测试通过');
  });
});
