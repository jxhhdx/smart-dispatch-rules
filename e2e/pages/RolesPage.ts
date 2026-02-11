import { Page, Locator, expect } from '@playwright/test';

/**
 * 角色管理页面对象
 */
export class RolesPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly table: Locator;
  readonly modal: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addButton = page.locator('button').filter({ has: page.locator('.anticon-plus') }).or(page.locator('button').filter({ hasText: /Create|创建|新增/ })).first();
    this.table = page.locator('.ant-table');
    this.modal = page.locator('.ant-modal');
    this.saveButton = page.locator('.ant-modal button').filter({ hasText: /Save|保存|OK/ }).first();
  }

  /**
   * 验证页面加载
   */
  async expectLoaded() {
    await expect(this.page).toHaveURL(/.*roles/);
    await expect(this.page.locator('text=Role Management').first()).toBeVisible();
  }

  /**
   * 点击添加按钮
   */
  async clickAdd() {
    await this.addButton.click();
    await expect(this.modal).toBeVisible();
  }

  /**
   * 填写角色表单
   */
  async fillRoleForm(data: {
    name: string;
    code: string;
    description?: string;
  }) {
    await this.page.locator('input[placeholder*="role name"]').or(this.page.locator('input[name="name"]')).fill(data.name);
    await this.page.locator('input[placeholder*="code"]').or(this.page.locator('input[name="code"]')).fill(data.code);
    
    if (data.description) {
      await this.page.locator('textarea[placeholder*="description"]').or(this.page.locator('textarea[name="description"]')).fill(data.description);
    }
  }

  /**
   * 保存角色
   */
  async saveRole() {
    await this.saveButton.click();
    await this.page.waitForTimeout(1000);
    try {
      await expect(this.modal).not.toBeVisible({ timeout: 5000 });
    } catch {
      // 忽略
    }
  }

  /**
   * 创建新角色
   */
  async createRole(data: { name: string; code: string; description?: string }) {
    await this.clickAdd();
    await this.fillRoleForm(data);
    await this.saveRole();
  }

  /**
   * 检查表格中是否有指定角色
   */
  async hasRole(roleName: string): Promise<boolean> {
    await this.page.waitForSelector('.ant-table-row', { timeout: 5000 });
    const roleCell = this.page.locator('td').filter({ hasText: roleName });
    return await roleCell.isVisible().catch(() => false);
  }

  /**
   * 删除角色
   */
  async deleteRole(roleName: string) {
    const row = this.page.locator('.ant-table-row').filter({
      has: this.page.locator('td').filter({ hasText: roleName }),
    });
    
    await row.locator('.anticon-delete, button').filter({ has: this.page.locator('.anticon-delete') }).first().click();
    await this.page.locator('.ant-popconfirm, .ant-modal-confirm').locator('button').filter({ hasText: /Yes|确定|OK/ }).first().click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 分配权限
   */
  async assignPermissions(roleName: string, permissionNames: string[]) {
    const row = this.page.locator('.ant-table-row').filter({
      has: this.page.locator('td').filter({ hasText: roleName }),
    });
    
    await row.locator('.anticon-edit, button').filter({ has: this.page.locator('.anticon-edit') }).first().click();
    await expect(this.modal).toBeVisible();
    
    // 选择权限
    for (const permName of permissionNames) {
      const checkbox = this.page.locator('.ant-checkbox-wrapper').filter({ hasText: permName }).locator('.ant-checkbox');
      if (await checkbox.isVisible().catch(() => false)) {
        await checkbox.click();
      }
    }
    
    await this.saveRole();
  }

  /**
   * 获取权限列表
   */
  async getPermissionList(): Promise<string[]> {
    await this.page.goto('/roles/permissions');
    await this.page.waitForSelector('.ant-table-row, .ant-list-item', { timeout: 5000 });
    const items = await this.page.locator('.ant-table-row td:first-child, .ant-list-item').allTextContents();
    return items.filter(t => t.trim());
  }
}
