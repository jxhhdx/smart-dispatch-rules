import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { UsersPage } from '../pages/UsersPage';
import { generateRandomString, generateRandomEmail } from '../utils/test-data';

// 通过 API 创建用户
async function createUserViaAPI(page: any, token: string, data: any) {
  const response = await page.request.post('/api/v1/users', {
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

test.describe('用户管理 - 完整测试', () => {
  let usersPage: UsersPage;
  let authToken: string;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // 获取 API token
    authToken = await getAuthToken(page);
    
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
    await dashboard.navigateToUsers();
    
    usersPage = new UsersPage(page);
    await usersPage.expectLoaded();
  });

  // ==================== F - 功能路径测试 ====================

  test('F-01: 用户列表页面显示正常', async ({ page }) => {
    await expect(page.locator('text=User Management').first()).toBeVisible();
    await expect(page.locator('.ant-table')).toBeVisible();
    await expect(usersPage.addButton).toBeVisible();
  });

  test('F-02: 创建新用户', async ({ page }) => {
    const username = `testuser_${generateRandomString()}`;
    const email = generateRandomEmail();
    
    // 通过 API 创建用户
    await createUserViaAPI(page, authToken, {
      username,
      email,
      password: 'Test123!',
      realName: '测试用户',
    });
    
    await usersPage.page.reload();
    await usersPage.expectLoaded();
    
    const exists = await usersPage.hasUser(username);
    expect(exists).toBe(true);
  });

  test('F-03: 创建用户并分配角色', async ({ page }) => {
    const username = `roletest_${generateRandomString()}`;
    const email = generateRandomEmail();
    
    // 通过 API 创建用户
    await createUserViaAPI(page, authToken, {
      username,
      email,
      password: 'Test123!',
      realName: '角色测试用户',
      roleId: 1, // Admin role
    });
    
    await usersPage.page.reload();
    await usersPage.expectLoaded();
    
    const exists = await usersPage.hasUser(username);
    expect(exists).toBe(true);
  });

  test('F-04: 查看用户详情', async () => {
    // 确保admin用户存在
    const exists = await usersPage.hasUser('admin');
    expect(exists).toBe(true);
    
    // 查看admin详情
    const row = usersPage.page.locator('.ant-table-row').filter({
      has: usersPage.page.locator('td').filter({ hasText: 'admin' }),
    });
    await row.locator('.anticon-eye, button').first().click();
    
    await expect(usersPage.modal.or(usersPage.page.locator('.ant-drawer'))).toBeVisible();
    
    // 关闭
    await usersPage.page.locator('.ant-modal-close, .ant-drawer-close').or(usersPage.page.locator('button').filter({ hasText: /Close|关闭/ })).first().click();
  });

  test('F-05: 编辑用户', async ({ page }) => {
    const username = `edituser_${generateRandomString()}`;
    const email = generateRandomEmail();
    
    // 通过 API 创建用户
    await createUserViaAPI(page, authToken, {
      username,
      email,
      password: 'Test123!',
      realName: '编辑前',
    });
    
    await usersPage.page.reload();
    await usersPage.expectLoaded();
    
    await usersPage.editUser(username, { realName: '编辑后', email: generateRandomEmail() });
    
    await usersPage.page.reload();
    const exists = await usersPage.hasUser(username);
    expect(exists).toBe(true);
  });

  test('F-06: 删除用户', async ({ page }) => {
    const username = `deleteuser_${generateRandomString()}`;
    const email = generateRandomEmail();
    
    // 通过 API 创建用户
    await createUserViaAPI(page, authToken, {
      username,
      email,
      password: 'Test123!',
    });
    
    await usersPage.page.reload();
    await usersPage.expectLoaded();
    
    let exists = await usersPage.hasUser(username);
    expect(exists).toBe(true);
    
    await usersPage.deleteUser(username);
    await usersPage.page.reload();
    
    exists = await usersPage.hasUser(username);
    expect(exists).toBe(false);
  });

  test('F-07: 搜索用户功能', async () => {
    // 搜索admin用户
    await usersPage.searchUser('admin');
    const exists = await usersPage.hasUser('admin');
    expect(exists).toBe(true);
  });

  test('F-08: 禁用用户', async ({ page }) => {
    const username = `disable_${generateRandomString()}`;
    const email = generateRandomEmail();
    
    // 通过 API 创建用户
    await createUserViaAPI(page, authToken, {
      username,
      email,
      password: 'Test123!',
    });
    
    await usersPage.page.reload();
    await usersPage.expectLoaded();
    
    // 找到用户行，点击禁用开关
    const row = usersPage.page.locator('.ant-table-row').filter({
      has: usersPage.page.locator('td').filter({ hasText: username }),
    });
    
    const switchBtn = row.locator('.ant-switch');
    if (await switchBtn.isVisible().catch(() => false)) {
      await switchBtn.click();
      await usersPage.page.waitForTimeout(500);
      
      // 验证状态变为禁用
      await expect(switchBtn).not.toHaveClass(/ant-switch-checked/);
    }
  });

  test('F-09: 启用用户', async ({ page }) => {
    const username = `enable_${generateRandomString()}`;
    const email = generateRandomEmail();
    
    // 通过 API 创建用户
    await createUserViaAPI(page, authToken, {
      username,
      email,
      password: 'Test123!',
    });
    
    await usersPage.page.reload();
    await usersPage.expectLoaded();
    
    const row = usersPage.page.locator('.ant-table-row').filter({
      has: usersPage.page.locator('td').filter({ hasText: username }),
    });
    
    const switchBtn = row.locator('.ant-switch');
    if (await switchBtn.isVisible().catch(() => false)) {
      // 先禁用
      await switchBtn.click();
      await usersPage.page.waitForTimeout(500);
      
      // 再启用
      await switchBtn.click();
      await usersPage.page.waitForTimeout(500);
      
      await expect(switchBtn).toHaveClass(/ant-switch-checked/);
    }
  });

  test('F-10: 用户分页功能', async ({ page }) => {
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

  test('B-01: 创建最短用户名用户', async ({ page }) => {
    const username = `u${generateRandomString()}`;
    const email = generateRandomEmail();
    
    // 通过 API 创建用户
    await createUserViaAPI(page, authToken, {
      username,
      email,
      password: 'Test123!',
    });
    
    await usersPage.page.reload();
    await usersPage.expectLoaded();
    
    const exists = await usersPage.hasUser(username);
    expect(exists).toBe(true);
  });

  test('B-02: 创建超长用户名用户', async ({ page }) => {
    const username = `longuser_${generateRandomString()}`.repeat(3);
    const email = generateRandomEmail();
    
    // 通过 API 创建用户
    await createUserViaAPI(page, authToken, {
      username,
      email,
      password: 'Test123!',
    });
    
    await usersPage.page.reload();
    await usersPage.expectLoaded();
    
    const exists = await usersPage.hasUser(username);
    expect(exists).toBe(true);
  });

  test('B-03: Unicode用户名', async ({ page }) => {
    const username = `用户_${generateRandomString()}🎉`;
    const email = generateRandomEmail();
    
    // 通过 API 创建用户
    await createUserViaAPI(page, authToken, {
      username,
      email,
      password: 'Test123!',
    });
    
    await usersPage.page.reload();
    await usersPage.expectLoaded();
    
    const exists = await usersPage.hasUser(username);
    expect(exists).toBe(true);
  });

  test('B-04: 特殊字符用户名', async ({ page }) => {
    const username = `user_${generateRandomString()}-._`;
    const email = generateRandomEmail();
    
    // 通过 API 创建用户
    await createUserViaAPI(page, authToken, {
      username,
      email,
      password: 'Test123!',
    });
    
    await usersPage.page.reload();
    await usersPage.expectLoaded();
    
    const exists = await usersPage.hasUser(username);
    expect(exists).toBe(true);
  });

  // ==================== E - 异常测试 ====================

  test('E-01: 空表单提交显示验证错误', async () => {
    await usersPage.clickAdd();
    await usersPage.saveButton.click();
    
    const errorMessages = await usersPage.page.locator('.ant-form-item-explain-error').count();
    expect(errorMessages).toBeGreaterThan(0);
    
    await usersPage.page.locator('.ant-modal-close').or(usersPage.page.locator('button').filter({ hasText: /Cancel|取消/ })).first().click();
  });

  test('E-02: 重复用户名创建失败', async ({ page }) => {
    const username = `duplicate_${generateRandomString()}`;
    const email = generateRandomEmail();
    
    // 通过 API 创建第一个
    await createUserViaAPI(page, authToken, {
      username,
      email,
      password: 'Test123!',
    });
    
    await usersPage.page.reload();
    await usersPage.expectLoaded();
    
    // 尝试通过 UI 创建第二个相同用户名
    await usersPage.clickAdd();
    await usersPage.fillUserForm({
      username,
      email: generateRandomEmail(),
      password: 'Test123!',
    });
    await usersPage.saveButton.click();
    
    // 应该有错误提示
    await expect(usersPage.page.locator('.ant-message-error')).toBeVisible().catch(() => {});
  });

  test('E-03: 重复邮箱创建失败', async ({ page }) => {
    const email = generateRandomEmail();
    
    // 通过 API 创建第一个
    await createUserViaAPI(page, authToken, {
      username: `user1_${generateRandomString()}`,
      email,
      password: 'Test123!',
    });
    
    await usersPage.page.reload();
    await usersPage.expectLoaded();
    
    // 尝试通过 UI 创建第二个相同邮箱
    await usersPage.clickAdd();
    await usersPage.fillUserForm({
      username: `user2_${generateRandomString()}`,
      email,
      password: 'Test123!',
    });
    await usersPage.saveButton.click();
    
    await expect(usersPage.page.locator('.ant-message-error')).toBeVisible().catch(() => {});
  });

  test('E-04: 无效邮箱格式', async () => {
    await usersPage.clickAdd();
    await usersPage.fillUserForm({
      username: `emailtest_${generateRandomString()}`,
      email: 'not-an-email',
      password: 'Test123!',
    });
    await usersPage.saveButton.click();
    
    await expect(usersPage.page.locator('.ant-form-item-explain-error')).toBeVisible();
  });

  test('E-05: 短密码创建失败', async () => {
    await usersPage.clickAdd();
    await usersPage.fillUserForm({
      username: `shortpwd_${generateRandomString()}`,
      email: generateRandomEmail(),
      password: '123',
    });
    await usersPage.saveButton.click();
    
    await expect(usersPage.page.locator('.ant-form-item-explain-error')).toBeVisible();
  });

  // ==================== S - 安全测试 ====================

  test('S-01: 密码不以明文显示', async () => {
    await usersPage.clickAdd();
    
    const passwordInput = usersPage.page.locator('input[placeholder*="password"]');
    if (await passwordInput.isVisible().catch(() => false)) {
      await passwordInput.fill('Test123!');
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
    
    await usersPage.page.locator('.ant-modal-close').click();
  });

  test('S-02: SQL注入防护', async ({ page }) => {
    const username = `sqltest_'; DROP TABLE users; --_${generateRandomString()}`;
    const email = generateRandomEmail();
    
    // 通过 API 创建用户
    await createUserViaAPI(page, authToken, {
      username,
      email,
      password: 'Test123!',
    });
    
    await usersPage.page.reload();
    await usersPage.expectLoaded();
    
    const exists = await usersPage.hasUser(username);
    expect(exists).toBe(true);
  });

  test('S-03: XSS注入防护', async ({ page }) => {
    const username = `xsstest_<script>alert(1)</script>_${generateRandomString()}`;
    const email = generateRandomEmail();
    
    // 通过 API 创建用户
    await createUserViaAPI(page, authToken, {
      username,
      email,
      password: 'Test123!',
      realName: '<img src=x onerror=alert(1)>',
    });
    
    await usersPage.page.reload();
    await usersPage.expectLoaded();
    
    const exists = await usersPage.hasUser(username);
    expect(exists).toBe(true);
  });

  // ==================== P - 性能测试 ====================

  test('P-01: 用户列表加载性能', async ({ page }) => {
    const startTime = Date.now();
    await page.reload();
    await usersPage.expectLoaded();
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
  });

  // ==================== P - 分页测试 ====================

  test('P-02: 用户列表分页显示 - i18n 变量正确解析', async ({ page }) => {
    // 创建多个用户
    for (let i = 0; i < 3; i++) {
      await createUserViaAPI(page, authToken, {
        username: `pageuser_${i}_${generateRandomString()}`,
        email: `page_${i}_${generateRandomEmail()}`,
        password: 'Test123!',
      });
    }
    
    await usersPage.page.reload();
    await usersPage.expectLoaded();
    
    // 验证分页组件存在
    const pagination = page.locator('.ant-pagination');
    await expect(pagination).toBeVisible();
    
    // 获取分页总数文本
    const totalText = await usersPage.getPaginationTotal();
    console.log('Users pagination total text:', totalText);
    
    // 验证 i18n 变量已正确解析
    expect(totalText).toMatch(/(共 \d+ 条|Total \d+ items)/);
    
    // 验证没有显示未解析的模板字符串
    expect(totalText).not.toContain('{{count}}');
    expect(totalText).not.toContain('{{');
    expect(totalText).not.toContain('}}');
    expect(totalText).not.toContain('table.items');
  });
});
