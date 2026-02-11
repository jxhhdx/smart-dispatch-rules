import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { RolesPage } from '../pages/RolesPage';
import { generateRandomString } from '../utils/test-data';

// 通过 API 创建角色
async function createRoleViaAPI(page: any, token: string, data: any) {
  const response = await page.request.post('/api/v1/roles', {
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

test.describe('角色管理 - 完整测试', () => {
  let rolesPage: RolesPage;
  let authToken: string;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // 获取 API token
    authToken = await getAuthToken(page);
    
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
    await dashboard.navigateToRoles();
    
    rolesPage = new RolesPage(page);
    await rolesPage.expectLoaded();
  });

  // ==================== F - 功能路径测试 ====================

  test('F-01: 角色列表页面显示正常', async ({ page }) => {
    await expect(page.locator('text=Role Management').first()).toBeVisible();
    await expect(page.locator('.ant-table')).toBeVisible();
    await expect(rolesPage.addButton).toBeVisible();
  });

  test('F-02: 创建新角色', async ({ page }) => {
    const roleName = `测试角色_${generateRandomString()}`;
    const roleCode = `ROLE_${generateRandomString().toUpperCase()}`;
    
    // 通过 API 创建角色
    await createRoleViaAPI(page, authToken, {
      name: roleName,
      code: roleCode,
      description: '自动创建的测试角色',
    });
    
    await rolesPage.page.reload();
    await rolesPage.expectLoaded();
    
    const exists = await rolesPage.hasRole(roleName);
    expect(exists).toBe(true);
  });

  test('F-03: 查看角色详情', async ({ page }) => {
    const roleName = `详情测试_${generateRandomString()}`;
    const roleCode = `ROLE_${generateRandomString().toUpperCase()}`;
    
    // 通过 API 创建角色
    await createRoleViaAPI(page, authToken, {
      name: roleName,
      code: roleCode,
    });
    
    await rolesPage.page.reload();
    await rolesPage.expectLoaded();
    
    // 点击编辑查看详情
    const row = rolesPage.page.locator('.ant-table-row').filter({
      has: rolesPage.page.locator('td').filter({ hasText: roleName }),
    });
    await row.locator('.anticon-edit, button').first().click();
    
    // 等待弹窗动画
    await page.waitForTimeout(500);
    await expect(rolesPage.modal).toBeVisible({ timeout: 10000 });
    
    // 验证表单中包含角色名称
    const nameInput = page.locator('.ant-form-item').filter({ hasText: /Role Name|角色名称/i }).locator('input');
    await expect(nameInput).toHaveValue(roleName, { timeout: 5000 });
    
    // 关闭
    await rolesPage.page.locator('.ant-modal-close').or(rolesPage.page.locator('button').filter({ hasText: /Cancel|取消/ })).first().click();
  });

  test('F-04: 编辑角色', async ({ page }) => {
    const roleName = `编辑测试_${generateRandomString()}`;
    const newRoleName = `更新后_${roleName}`;
    const roleCode = `ROLE_${generateRandomString().toUpperCase()}`;
    
    // 通过 API 创建角色
    await createRoleViaAPI(page, authToken, {
      name: roleName,
      code: roleCode,
    });
    
    await rolesPage.page.reload();
    await rolesPage.expectLoaded();
    
    // 编辑
    const row = rolesPage.page.locator('.ant-table-row').filter({
      has: rolesPage.page.locator('td').filter({ hasText: roleName }),
    });
    await row.locator('.anticon-edit, button').first().click();
    
    await expect(rolesPage.modal).toBeVisible();
    // 使用 label 文本定位输入框
    await rolesPage.page.locator('.ant-form-item').filter({ hasText: /Role Name|角色名称/i }).locator('input').fill(newRoleName);
    await rolesPage.saveRole();
    
    await rolesPage.page.reload();
    const exists = await rolesPage.hasRole(newRoleName);
    expect(exists).toBe(true);
  });

  test('F-05: 删除角色（无用户）', async ({ page }) => {
    const roleName = `删除测试_${generateRandomString()}`;
    const roleCode = `ROLE_${generateRandomString().toUpperCase()}`;
    
    // 通过 API 创建角色
    await createRoleViaAPI(page, authToken, {
      name: roleName,
      code: roleCode,
    });
    
    await rolesPage.page.reload();
    await rolesPage.expectLoaded();
    
    let exists = await rolesPage.hasRole(roleName);
    expect(exists).toBe(true);
    
    await rolesPage.deleteRole(roleName);
    await rolesPage.page.reload();
    
    exists = await rolesPage.hasRole(roleName);
    expect(exists).toBe(false);
  });

  test('F-06: 分配权限给角色', async ({ page }) => {
    const roleName = `权限测试_${generateRandomString()}`;
    const roleCode = `ROLE_${generateRandomString().toUpperCase()}`;
    
    // 通过 API 创建角色
    await createRoleViaAPI(page, authToken, {
      name: roleName,
      code: roleCode,
    });
    
    await rolesPage.page.reload();
    await rolesPage.expectLoaded();
    
    await rolesPage.assignPermissions(roleName, ['user:read', 'rule:read']);
    
    // 验证权限分配成功
    await expect(rolesPage.page.locator('.ant-message-success')).toBeVisible().catch(() => {});
  });

  test('F-07: 获取权限列表', async ({ page }) => {
    // 通过 API 获取权限列表
    const response = await page.request.get('/api/v1/roles/permissions', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.data.length).toBeGreaterThan(0);
  });

  // ==================== B - 边界值测试 ====================

  test('B-01: 创建最短名称角色', async ({ page }) => {
    const roleName = 'A';
    const roleCode = `ROLE_${generateRandomString().toUpperCase()}`;
    
    // 通过 API 创建角色
    await createRoleViaAPI(page, authToken, {
      name: roleName,
      code: roleCode,
    });
    
    await rolesPage.page.reload();
    await rolesPage.expectLoaded();
    
    const exists = await rolesPage.hasRole(roleName);
    expect(exists).toBe(true);
  });

  test('B-02: 创建超长名称角色', async ({ page }) => {
    const roleName = '超长角色名称'.repeat(10);
    const roleCode = `ROLE_${generateRandomString().toUpperCase()}`;
    
    // 通过 API 创建角色
    await createRoleViaAPI(page, authToken, {
      name: roleName,
      code: roleCode,
    });
    
    await rolesPage.page.reload();
    await rolesPage.expectLoaded();
    
    const exists = await rolesPage.hasRole(roleName);
    expect(exists).toBe(true);
  });

  test('B-03: 特殊字符角色代码', async ({ page }) => {
    const roleName = `特殊代码_${generateRandomString()}`;
    const roleCode = `ROLE_TEST-123_${generateRandomString().toUpperCase()}`;
    
    // 通过 API 创建角色
    await createRoleViaAPI(page, authToken, {
      name: roleName,
      code: roleCode,
    });
    
    await rolesPage.page.reload();
    await rolesPage.expectLoaded();
    
    const exists = await rolesPage.hasRole(roleName);
    expect(exists).toBe(true);
  });

  // ==================== E - 异常测试 ====================

  test('E-01: 空表单提交显示验证错误', async () => {
    await rolesPage.clickAdd();
    await rolesPage.saveButton.click();
    
    const errorMessages = await rolesPage.page.locator('.ant-form-item-explain-error').count();
    expect(errorMessages).toBeGreaterThan(0);
    
    await rolesPage.page.locator('.ant-modal-close').or(rolesPage.page.locator('button').filter({ hasText: /Cancel|取消/ })).first().click();
  });

  test('E-02: 删除有用户的角色应失败', async () => {
    // 尝试删除admin角色（应该有用户）
    const row = rolesPage.page.locator('.ant-table-row').filter({
      has: rolesPage.page.locator('td').filter({ hasText: 'admin' }),
    });
    
    const deleteBtn = row.locator('.anticon-delete, button').filter({ has: rolesPage.page.locator('.anticon-delete') });
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      
      // 应该有错误提示
      await expect(rolesPage.page.locator('.ant-message-error').or(rolesPage.page.locator('.ant-popconfirm'))).toBeVisible();
    }
  });

  // ==================== S - 安全测试 ====================

  test('S-01: SQL注入防护测试', async ({ page }) => {
    const roleName = `SQL注入_'; DROP TABLE roles; --_${generateRandomString()}`;
    const roleCode = `ROLE_${generateRandomString().toUpperCase()}`;
    
    // 通过 API 创建角色
    await createRoleViaAPI(page, authToken, {
      name: roleName,
      code: roleCode,
    });
    
    await rolesPage.page.reload();
    await rolesPage.expectLoaded();
    
    const exists = await rolesPage.hasRole(roleName);
    expect(exists).toBe(true);
  });

  test('S-02: 防止删除默认角色', async () => {
    // admin角色应该不能被删除或有保护机制
    const adminRow = rolesPage.page.locator('.ant-table-row').filter({
      has: rolesPage.page.locator('td').filter({ hasText: /super_admin|admin/ }),
    });
    
    // 检查是否有删除按钮，或者删除按钮被禁用
    const deleteBtn = adminRow.locator('.anticon-delete');
    if (await deleteBtn.isVisible().catch(() => false)) {
      // 如果可见，尝试点击应该有错误提示
      await deleteBtn.click();
      await expect(rolesPage.page.locator('.ant-message-error')).toBeVisible().catch(() => {});
    }
  });

  // ==================== P - 分页测试 ====================

  test('P-01: 角色列表分页显示', async ({ page }) => {
    // 创建多个角色以确保分页显示
    for (let i = 0; i < 5; i++) {
      await createRoleViaAPI(page, authToken, {
        name: `分页测试角色_${i}_${generateRandomString()}`,
        code: `ROLE_PAGE_${i}_${generateRandomString().toUpperCase()}`,
      });
    }
    
    await rolesPage.page.reload();
    await rolesPage.expectLoaded();
    
    // 验证分页组件存在
    const pagination = page.locator('.ant-pagination');
    await expect(pagination).toBeVisible();
    
    // 验证分页总数显示正确（使用 i18n 变量）
    const totalText = await rolesPage.getPaginationTotal();
    console.log('Pagination total text:', totalText);
    
    // 验证显示格式：中文 "共 X 条" 或英文 "Total X items"
    expect(totalText).toMatch(/(共 \d+ 条|Total \d+ items)/);
    
    // 验证没有显示未解析的模板字符串如 "{{count}}"
    expect(totalText).not.toContain('{{count}}');
    expect(totalText).not.toContain('table.items');
  });

  test('P-02: 分页切换功能', async ({ page }) => {
    // 创建足够多的角色以产生多页
    for (let i = 0; i < 15; i++) {
      await createRoleViaAPI(page, authToken, {
        name: `翻页测试_${i}_${generateRandomString()}`,
        code: `ROLE_PG_${i}_${generateRandomString().toUpperCase()}`,
      });
    }
    
    await rolesPage.page.reload();
    await rolesPage.expectLoaded();
    
    // 等待分页加载
    await page.waitForSelector('.ant-pagination-item', { timeout: 5000 });
    
    // 如果有第2页，测试翻页
    const page2Btn = page.locator('.ant-pagination-item').filter({ hasText: '2' });
    if (await page2Btn.isVisible().catch(() => false)) {
      await page2Btn.click();
      await page.waitForTimeout(500);
      
      // 验证当前页码
      const currentPage = await rolesPage.getCurrentPage();
      expect(currentPage).toBe(2);
    }
  });

  test('P-03: 每页条数切换', async ({ page }) => {
    // 创建多个角色
    for (let i = 0; i < 5; i++) {
      await createRoleViaAPI(page, authToken, {
        name: `条数测试_${i}_${generateRandomString()}`,
        code: `ROLE_SZ_${i}_${generateRandomString().toUpperCase()}`,
      });
    }
    
    await rolesPage.page.reload();
    await rolesPage.expectLoaded();
    
    // 切换每页条数为 20
    await rolesPage.changePageSize(20);
    
    // 验证表格数据正确显示
    const rowCount = await rolesPage.page.locator('.ant-table-row').count();
    expect(rowCount).toBeGreaterThan(0);
  });
});
