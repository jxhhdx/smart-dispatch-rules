import { Page, Locator, expect } from '@playwright/test';

/**
 * 用户管理页面对象
 */
export class UsersPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly table: Locator;
  readonly modal: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // 使用图标按钮或包含 Create/创建 文本的按钮
    this.addButton = page.locator('button').filter({ has: page.locator('.anticon-plus') }).or(page.locator('button').filter({ hasText: /Create|创建|新增/ })).first();
    this.table = page.locator('.ant-table');
    this.modal = page.locator('.ant-modal');
    // 保存按钮在 Modal 中
    this.saveButton = page.locator('.ant-modal button').filter({ hasText: /Save|保存|OK/ }).first();
  }

  /**
   * 验证页面加载
   * 支持中英文: User Management / 用户管理
   */
  async expectLoaded() {
    await expect(this.page).toHaveURL(/.*users/, { timeout: 10000 });
    await expect(this.page.locator('text=/User Management|用户管理/i').first()).toBeVisible();
  }

  /**
   * 点击添加按钮
   */
  async clickAdd() {
    await this.addButton.click();
    await expect(this.modal).toBeVisible();
  }

  /**
   * 填写用户表单 - 使用 Form label 定位
   */
  async fillUserForm(data: {
    username: string;
    email: string;
    password: string;
    realName?: string;
    phone?: string;
    roleId?: string;
  }) {
    // 等待弹窗动画完成
    await this.page.waitForTimeout(500);
    
    // 使用 label 文本定位字段
    await this.page.locator('.ant-form-item').filter({ hasText: /Username|用户名/i }).locator('input').fill(data.username);
    await this.page.locator('.ant-form-item').filter({ hasText: /Email|邮箱/i }).locator('input').fill(data.email);
    
    // 填写密码（如果是新建用户）
    if (data.password) {
      const passwordItem = this.page.locator('.ant-form-item').filter({ hasText: /Password|密码/i });
      const passwordInput = passwordItem.locator('input');
      if (await passwordInput.isVisible().catch(() => false)) {
        await passwordInput.fill(data.password);
      }
    }
    
    // 填写真实姓名
    if (data.realName) {
      await this.page.locator('.ant-form-item').filter({ hasText: /Real Name|真实姓名/i }).locator('input').fill(data.realName);
    }
    
    // 填写电话
    if (data.phone) {
      await this.page.locator('.ant-form-item').filter({ hasText: /Phone|电话/i }).locator('input').fill(data.phone);
    }
    
    // 选择角色
    if (data.roleId) {
      await this.page.locator('.ant-form-item').filter({ hasText: /Role|角色/i }).locator('.ant-select').click();
      await this.page.waitForTimeout(300);
      await this.page.locator('.ant-select-dropdown').locator('.ant-select-item').filter({ hasText: data.roleId }).click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * 保存用户
   */
  async saveUser() {
    await this.saveButton.click();
    // 等待保存完成和表格刷新
    await this.page.waitForTimeout(2000);
    // 尝试等待 Modal 关闭
    try {
      await expect(this.modal).not.toBeVisible({ timeout: 5000 });
    } catch {
      // 忽略错误
    }
    // 额外等待表格加载完成
    await this.page.waitForTimeout(1000);
  }

  /**
   * 创建新用户（完整流程）
   */
  async createUser(data: {
    username: string;
    email: string;
    password: string;
    realName?: string;
    phone?: string;
    roleId?: string;
  }) {
    await this.clickAdd();
    await this.fillUserForm(data);
    await this.saveUser();
  }

  /**
   * 在表格中搜索用户
   */
  async searchUser(username: string) {
    const searchInput = this.page.locator('input[placeholder*="Search"]').or(this.page.locator('.ant-input-search input'));
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(username);
      await this.page.locator('.ant-input-search-button, button').filter({ has: this.page.locator('.anticon-search') }).first().click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * 检查表格中是否有指定用户
   */
  async hasUser(username: string): Promise<boolean> {
    // 等待表格加载完成
    await this.page.waitForSelector('.ant-table-row', { timeout: 5000 });
    const userCell = this.page.locator('td').filter({ hasText: username });
    return await userCell.isVisible().catch(() => false);
  }

  /**
   * 获取表格行数
   */
  async getTableRowCount(): Promise<number> {
    return await this.page.locator('.ant-table-row').count();
  }

  /**
   * 删除用户
   */
  async deleteUser(username: string) {
    const row = this.page.locator('.ant-table-row').filter({
      has: this.page.locator('td').filter({ hasText: username }),
    });
    
    // 点击 Delete 图标
    await row.locator('.anticon-delete, button').filter({ has: this.page.locator('.anticon-delete') }).first().click();
    
    // 确认删除
    await this.page.locator('.ant-popconfirm, .ant-modal-confirm').locator('button').filter({ hasText: /Yes|确定|OK/ }).first().click();
    
    // 等待删除完成
    await this.page.waitForTimeout(500);
  }

  /**
   * 编辑用户
   */
  async editUser(username: string, newData: { realName?: string; email?: string }) {
    const row = this.page.locator('.ant-table-row').filter({
      has: this.page.locator('td').filter({ hasText: username }),
    });
    
    // 点击 Edit 图标
    await row.locator('.anticon-edit, button').filter({ has: this.page.locator('.anticon-edit') }).first().click();
    
    // 等待 Modal 打开
    await expect(this.modal).toBeVisible();
    
    // 修改数据
    if (newData.realName) {
      await this.page.locator('input[name="realName"]').fill(newData.realName);
    }
    if (newData.email) {
      await this.page.locator('input[name="email"]').fill(newData.email);
    }
    
    await this.saveUser();
  }

  /**
   * 点击表头排序
   */
  async sortByColumn(columnName: string) {
    const header = this.page.locator('th').filter({ hasText: new RegExp(columnName, 'i') });
    await header.click();
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

}
