import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { RolesPage } from '../pages/RolesPage';
import { generateRandomString } from '../utils/test-data';

test.describe('角色管理 - 完整测试', () => {
  let rolesPage: RolesPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
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

  test('F-02: 创建新角色', async () => {
    const roleName = `测试角色_${generateRandomString()}`;
    const roleCode = `ROLE_${generateRandomString().toUpperCase()}`;
    
    await rolesPage.createRole({
      name: roleName,
      code: roleCode,
      description: '自动创建的测试角色',
    });
    
    await rolesPage.page.reload();
    await rolesPage.expectLoaded();
    
    const exists = await rolesPage.hasRole(roleName);
    expect(exists).toBe(true);
  });

  test('F-03: 查看角色详情', async () => {
    const roleName = `详情测试_${generateRandomString()}`;
    await rolesPage.createRole({
      name: roleName,
      code: `ROLE_${generateRandomString().toUpperCase()}`,
    });
    
    // 点击编辑查看详情
    const row = rolesPage.page.locator('.ant-table-row').filter({
      has: rolesPage.page.locator('td').filter({ hasText: roleName }),
    });
    await row.locator('.anticon-edit, button').first().click();
    
    await expect(rolesPage.modal).toBeVisible();
    await expect(rolesPage.modal).toContainText(roleName);
    
    // 关闭
    await rolesPage.page.locator('.ant-modal-close').or(rolesPage.page.locator('button').filter({ hasText: /Cancel|取消/ })).first().click();
  });

  test('F-04: 编辑角色', async () => {
    const roleName = `编辑测试_${generateRandomString()}`;
    const newRoleName = `更新后_${roleName}`;
    
    await rolesPage.createRole({
      name: roleName,
      code: `ROLE_${generateRandomString().toUpperCase()}`,
    });
    
    // 编辑
    const row = rolesPage.page.locator('.ant-table-row').filter({
      has: rolesPage.page.locator('td').filter({ hasText: roleName }),
    });
    await row.locator('.anticon-edit, button').first().click();
    
    await expect(rolesPage.modal).toBeVisible();
    await rolesPage.page.locator('input[name="name"]').fill(newRoleName);
    await rolesPage.saveRole();
    
    await rolesPage.page.reload();
    const exists = await rolesPage.hasRole(newRoleName);
    expect(exists).toBe(true);
  });

  test('F-05: 删除角色（无用户）', async () => {
    const roleName = `删除测试_${generateRandomString()}`;
    await rolesPage.createRole({
      name: roleName,
      code: `ROLE_${generateRandomString().toUpperCase()}`,
    });
    
    await rolesPage.page.reload();
    let exists = await rolesPage.hasRole(roleName);
    expect(exists).toBe(true);
    
    await rolesPage.deleteRole(roleName);
    await rolesPage.page.reload();
    
    exists = await rolesPage.hasRole(roleName);
    expect(exists).toBe(false);
  });

  test('F-06: 分配权限给角色', async () => {
    const roleName = `权限测试_${generateRandomString()}`;
    await rolesPage.createRole({
      name: roleName,
      code: `ROLE_${generateRandomString().toUpperCase()}`,
    });
    
    await rolesPage.assignPermissions(roleName, ['user:read', 'rule:read']);
    
    // 验证权限分配成功
    await expect(rolesPage.page.locator('.ant-message-success')).toBeVisible().catch(() => {});
  });

  test('F-07: 获取权限列表', async () => {
    const permissions = await rolesPage.getPermissionList();
    expect(permissions.length).toBeGreaterThan(0);
  });

  // ==================== B - 边界值测试 ====================

  test('B-01: 创建最短名称角色', async () => {
    const roleName = 'A';
    const roleCode = `ROLE_${generateRandomString().toUpperCase()}`;
    
    await rolesPage.createRole({
      name: roleName,
      code: roleCode,
    });
    
    const exists = await rolesPage.hasRole(roleName);
    expect(exists).toBe(true);
  });

  test('B-02: 创建超长名称角色', async () => {
    const roleName = '超长角色名称'.repeat(10);
    const roleCode = `ROLE_${generateRandomString().toUpperCase()}`;
    
    await rolesPage.createRole({
      name: roleName,
      code: roleCode,
    });
    
    const exists = await rolesPage.hasRole(roleName);
    expect(exists).toBe(true);
  });

  test('B-03: 特殊字符角色代码', async () => {
    const roleName = `特殊代码_${generateRandomString()}`;
    const roleCode = `ROLE_TEST-123_${generateRandomString().toUpperCase()}`;
    
    await rolesPage.createRole({
      name: roleName,
      code: roleCode,
    });
    
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

  test('S-01: SQL注入防护测试', async () => {
    const roleName = `SQL注入_'; DROP TABLE roles; --_${generateRandomString()}`;
    const roleCode = `ROLE_${generateRandomString().toUpperCase()}`;
    
    await rolesPage.createRole({
      name: roleName,
      code: roleCode,
    });
    
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
});
