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
   * 支持中英文: Role Management / 角色管理
   */
  async expectLoaded() {
    await expect(this.page).toHaveURL(/.*roles/, { timeout: 10000 });
    await expect(this.page.locator('text=/Role Management|角色管理/i').first()).toBeVisible();
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
    // 等待弹窗动画完成
    await this.page.waitForTimeout(500);
    
    // 使用 label 文本定位字段
    await this.page.locator('.ant-form-item').filter({ hasText: /Role Name|角色名称/i }).locator('input').fill(data.name);
    await this.page.locator('.ant-form-item').filter({ hasText: /Role Code|角色代码/i }).locator('input').fill(data.code);
    
    if (data.description) {
      await this.page.locator('.ant-form-item').filter({ hasText: /Description|描述/i }).locator('textarea').fill(data.description);
    }
  }

  /**
   * 保存角色
   */
  async saveRole() {
    await this.saveButton.click();
    // 等待保存完成和表格刷新
    await this.page.waitForTimeout(2000);
    try {
      await expect(this.modal).not.toBeVisible({ timeout: 5000 });
    } catch {
      // 忽略
    }
    // 额外等待表格加载完成
    await this.page.waitForTimeout(1000);
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

  // ==================== 分页操作 ====================

  /**
   * 获取分页总数文本
   */
  async getPaginationTotal(): Promise<string> {
    const pagination = this.page.locator('.ant-pagination-total-text');
    if (await pagination.isVisible().catch(() => false)) {
      return await pagination.textContent() || '';
    }
    return '';
  }

  /**
   * 切换到指定页码
   */
  async changePage(pageNumber: number) {
    const pageBtn = this.page.locator('.ant-pagination-item').filter({ hasText: pageNumber.toString() });
    if (await pageBtn.isVisible().catch(() => false)) {
      await pageBtn.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * 切换每页条数
   */
  async changePageSize(size: number) {
    const sizeSelector = this.page.locator('.ant-pagination-options-size-changer');
    if (await sizeSelector.isVisible().catch(() => false)) {
      await sizeSelector.click();
      await this.page.waitForTimeout(300);
      await this.page.locator('.ant-select-dropdown').locator('.ant-select-item').filter({ hasText: size.toString() }).click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * 获取当前页码
   */
  async getCurrentPage(): Promise<number> {
    const activePage = this.page.locator('.ant-pagination-item-active');
    if (await activePage.isVisible().catch(() => false)) {
      const text = await activePage.textContent();
      return parseInt(text || '1', 10);
    }
    return 1;
  }
}
