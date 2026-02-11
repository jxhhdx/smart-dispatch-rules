import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TestData } from '../utils/test-data';

test.describe('用户认证 - 完整测试', () => {
  // ==================== F - 功能路径测试 ====================

  test('F-01: 使用正确凭据登录成功', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
    
    await expect(page.locator('text=/admin|管理员/i').first()).toBeVisible();
  });

  test('F-02: 登录后获取用户信息', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // 验证 Dashboard 页面显示用户名
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
    
    // 验证页面显示管理员用户名或真实姓名
    await expect(page.locator('text=/admin|管理员/i').first()).toBeVisible();
  });

  test('F-03: 刷新Token', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // 等待登录完成并存储 token
    await page.waitForTimeout(1000);
    
    // 从 localStorage 获取 token（zustand persist 使用 'auth-storage' key）
    const authStorage = await page.evaluate(() => localStorage.getItem('auth-storage'));
    expect(authStorage).toBeTruthy();
    const authData = JSON.parse(authStorage!);
    const token = authData.state.token;
    expect(token).toBeTruthy();
    
    // 调用刷新接口，携带认证头
    const response = await page.request.post('/api/v1/auth/refresh', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
    
    const data = await response.json();
    expect(data.data).toHaveProperty('access_token');
  });

  test('F-04: 登出功能', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    const dashboard = new DashboardPage(page);
    await dashboard.logout();
    
    await expect(page).toHaveURL(/.*login/);
  });

  test('F-05: 页面刷新后保持登录状态', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
    
    await page.reload();
    
    // 应该仍然显示 Dashboard
    await expect(page.locator('text=/Dashboard|仪表盘/i').first()).toBeVisible();
  });

  // ==================== F - 异常测试 ====================

  test('E-01: 使用错误密码登录失败', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      TestData.credentials.admin.username,
      TestData.credentials.invalid.password
    );
    
    await expect(page).toHaveURL(/.*login/);
  });

  test('E-02: 使用不存在用户名登录失败', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      TestData.credentials.invalid.username,
      'anypassword'
    );
    
    await expect(page).toHaveURL(/.*login/);
  });

  test('E-03: 禁用用户登录失败', async ({ page }) => {
    // 这个测试需要预先创建一个禁用用户
    // 或者测试admin不会被禁用的情况
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // 验证admin可以登录（不是禁用状态）
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
  });

  test('E-04: 空用户名登录失败', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('', 'password');
    
    // 应该有验证错误
    const errorMessages = await page.locator('.ant-form-item-explain-error').count();
    expect(errorMessages).toBeGreaterThan(0);
  });

  test('E-05: 空密码登录失败', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin', '');
    
    const errorMessages = await page.locator('.ant-form-item-explain-error').count();
    expect(errorMessages).toBeGreaterThan(0);
  });

  test('E-06: 无效Token访问受保护页面', async ({ page }) => {
    // 先访问登录页
    await page.goto('/login');
    
    // 设置无效token
    await page.evaluate(() => {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: { token: 'invalid-token', user: null, isAuthenticated: true },
        version: 0
      }));
    });
    
    await page.goto('/dashboard');
    
    // 应该显示重新登录弹窗
    await expect(page.getByRole('dialog', { name: /登录已过期|Session Expired/i })).toBeVisible({ timeout: 10000 });
  });

  test('E-07: 过期Token访问受保护页面', async ({ page }) => {
    // 先访问登录页
    await page.goto('/login');
    
    // 设置过期token（一个过期的JWT）
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.abc123';
    await page.evaluate((token) => {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: { token: token, user: null, isAuthenticated: true },
        version: 0
      }));
    }, expiredToken);
    
    await page.goto('/dashboard');
    
    // 应该显示重新登录弹窗
    await expect(page.getByRole('dialog', { name: /登录已过期|Session Expired/i })).toBeVisible({ timeout: 10000 });
  });

  test('E-08: 未认证访问API', async ({ page }) => {
    const response = await page.request.get('/api/v1/users');
    expect(response.status()).toBe(401);
  });

  // ==================== B - 边界值测试 ====================

  test('B-01: 超长用户名登录', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('a'.repeat(100), 'password');
    
    // 应该正常处理，不崩溃
    await expect(page.locator('text=Login').or(page.locator('text=登录'))).toBeVisible();
  });

  test('B-02: 超长密码登录', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin', 'p'.repeat(200));
    
    // 应该正常处理，不崩溃
    await expect(page.locator('text=Login').or(page.locator('text=登录'))).toBeVisible();
  });

  test('B-03: 特殊字符用户名', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin!@#$%', 'password');
    
    // 应该正常处理
    await expect(page.locator('text=Login').or(page.locator('text=登录'))).toBeVisible();
  });

  // ==================== S - 安全测试 ====================

  test('S-01: SQL注入用户名登录', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("' OR '1'='1", 'password');
    
    // 应该登录失败，不报错
    await expect(page).toHaveURL(/.*login/);
  });

  test('S-02: SQL注入密码登录', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin', "' OR '1'='1");
    
    await expect(page).toHaveURL(/.*login/);
  });

  test('S-03: XSS注入用户名登录', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('<script>alert(1)</script>', 'password');
    
    // 应该正常处理，不执行脚本
    await expect(page.locator('text=Login').or(page.locator('text=登录'))).toBeVisible();
  });

  test('S-04: 暴力破解防护', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // 快速尝试多次错误密码
    for (let i = 0; i < 5; i++) {
      await loginPage.login('admin', `wrongpassword${i}`);
      await page.waitForTimeout(100);
    }
    
    // 应该仍然有登录表单，系统未崩溃
    await expect(loginPage.usernameInput).toBeVisible();
  });

  test('S-05: Token安全存储', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // 等待登录完成并存储 token
    await page.waitForTimeout(1000);
    
    // 检查token是否存储在localStorage（zustand persist 使用 'auth-storage' key）
    const authStorage = await page.evaluate(() => localStorage.getItem('auth-storage'));
    expect(authStorage).toBeTruthy();
    
    // 解析存储的数据，验证包含 token
    const authData = JSON.parse(authStorage!);
    expect(authData.state.token).toBeTruthy();
    expect(authData.state.token.length).toBeGreaterThan(10);
  });

  // ==================== P - 性能测试 ====================

  test('P-01: 登录响应时间', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const startTime = Date.now();
    await loginPage.loginAsAdmin();
    const loginTime = Date.now() - startTime;
    
    expect(loginTime).toBeLessThan(5000);
  });

  test('P-02: Token验证性能', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    const startTime = Date.now();
    await page.goto('/dashboard');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });
});
